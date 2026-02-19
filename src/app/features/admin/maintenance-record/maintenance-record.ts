import {
    Component,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { RecordService } from '../../../core/services/record.service';
import { Record } from '../../../core/models/record.model';
import { RecordFilter } from '../../../core/models/recordFilter.model';
import { WorkerNameDTO } from '../../../core/models/worker.model';

interface ActiveFilter {
    key: string;
    label: string;
    value: any;
}

@Component({
    selector: 'app-maintenance-record',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
        ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule,
        SelectModule, PopoverModule, DatePickerModule, TagModule, ChipModule,
        CheckboxModule, DividerModule, TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './maintenance-record.html',
    styleUrl: './maintenance-record.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceRecord {

    @ViewChild('dt') dt!: Table;

    records: Record[] = [];
    totalRecords = 0;
    loading = false;
    lastTableEvent: TableLazyLoadEvent | null = null;
    currentRequest: Subscription | null = null;

    activeFilters: ActiveFilter[] = [];
    filterFechaDesde: Date | null = null;
    filterFechaHasta: Date | null = null;
    filterValidado: boolean | null = null;

    validationOptions = [
        { label: 'Sí (Validados)', value: true },
        { label: 'No (Pendientes)', value: false }
    ];

    recordDialog = false;
    record: Record = this.getEmptyRecord();

    constructor(
        private recordService: RecordService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) { }

    private parseDate(dateValue: any): Date | undefined {
        if (!dateValue) return undefined;
        let date: Date;
        if (Array.isArray(dateValue)) {
            date = new Date(dateValue[0], (dateValue[1] || 1) - 1, dateValue[2] || 1, dateValue[3] || 0, dateValue[4] || 0);
        } else {
            date = new Date(dateValue);
        }
        return isNaN(date.getTime()) ? undefined : date;
    }

    getEmptyRecord(): Record {
        return {
            id: 0,
            fecha: new Date(),
            horas: 0,
            validado: false,
            id_tarea: { id: 0, nombre: '' },
            id_trabajador: { id: 0, dni: '' }
        };
    }

    loadRecords(event: TableLazyLoadEvent) {
        this.lastTableEvent = event;
        this.loading = true;
        this.cdr.markForCheck();

        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const hasFilters = this.filterFechaDesde || this.filterFechaHasta || this.filterValidado !== null;

        const filterParams: RecordFilter = {
            fecha_desde: this.filterFechaDesde ?? undefined,
            fecha_hasta: this.filterFechaHasta ?? undefined,
            validado: this.filterValidado ?? false
        };

        const request$ = hasFilters
            ? this.recordService.searchRecord(filterParams, page, size)
            : this.recordService.getRecords(page, size);

        this.currentRequest = request$
            .pipe(finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response) => {
                    this.records = response.content.map(r => ({
                        ...r,
                        fecha: this.parseDate(r.fecha) || new Date()
                    }));
                    this.totalRecords = response.totalElements;
                },
                error: (err) => {
                    console.error('Error cargando registros', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' });
                }
            });
    }

    applyFilters() {
        const filters: ActiveFilter[] = [];

        if (this.filterValidado !== null) {
            filters.push({
                key: 'validado',
                label: this.filterValidado ? 'Validado: Sí' : 'Validado: No',
                value: this.filterValidado
            });
        }

        if (this.filterFechaDesde) {
            filters.push({
                key: 'desde',
                label: `Desde: ${this.filterFechaDesde.toLocaleDateString()}`,
                value: this.filterFechaDesde
            });
        }

        if (this.filterFechaHasta) {
            filters.push({
                key: 'hasta',
                label: `Hasta: ${this.filterFechaHasta.toLocaleDateString()}`,
                value: this.filterFechaHasta
            });
        }

        this.activeFilters = filters;
        this.dt.reset();
    }

    clearFilters() {
        this.filterFechaDesde = null;
        this.filterFechaHasta = null;
        this.filterValidado = null;
        this.activeFilters = [];
        this.dt.reset();
    }

    editRecord(r: Record) {
        this.record = { ...r };
        this.recordDialog = true;
        this.cdr.markForCheck();
    }

    saveRecord() {
        if (this.record.horas < 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Las horas no pueden ser negativas' });
            return;
        }
        console.log('Guardando registro:', this.record);
        this.recordService.updateRecord(this.record).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado' });
                this.recordDialog = false;
                this.reloadCurrentPage();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar' });
            }
        });
    }

    deleteRecord(r: Record) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la imputación de ${r.horas}h del día ${r.fecha.toLocaleDateString()}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.recordService.deleteRecord(r.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado' });
                        this.reloadCurrentPage();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
                    }
                });
            }
        });
    }

    hideDialog() {
        this.recordDialog = false;
        this.cdr.markForCheck();
    }

    reloadCurrentPage() {
        if (this.lastTableEvent) {
            this.loadRecords(this.lastTableEvent);
        } else {
            this.dt.reset();
        }
    }
}