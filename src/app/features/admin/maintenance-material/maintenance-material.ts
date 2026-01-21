import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common'; // 👈 1. Importar registerLocaleData
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, delay, finalize, takeUntil } from 'rxjs/operators';

import localeEs from '@angular/common/locales/es';

import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { MaterialService } from '../../../core/services/material.service';
import { Material } from '../../../core/models/material.model';
import { MaterialFilter } from '../../../core/models/materialFilter.model';

registerLocaleData(localeEs, 'es-ES');

interface ActiveFilter {
    key: string;
    label: string;
    value: any;
}

@Component({
    selector: 'app-maintenance-material',
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule, ConfirmDialogModule,
        ToastModule, InputTextModule, InputNumberModule, ToolbarModule,
        SelectModule, PopoverModule, DividerModule, ChipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './maintenance-material.html',
    styleUrl: './maintenance-material.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceMaterial implements OnInit, OnDestroy {

    @ViewChild('dt') dt!: Table;

    materials: Material[] = [];
    activeFilters: ActiveFilter[] = [];

    totalRecords: number = 0;
    loading: boolean = false;

    lastTableEvent: TableLazyLoadEvent | null = null;
    searchTerm: string = '';
    
    stockMaximoFilter: number | null = null;
    precioMinimoFilter: number | null = null;
    precioMaximoFilter: number | null = null;

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private currentRequest: Subscription | null = null;

    materialDialog: boolean = false;
    material: Material = this.getEmptyMaterial();

    submitted: boolean = false;
    dialogTitle: string = '';

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private materialService: MaterialService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.searchSubject.pipe(
            debounceTime(750),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe((term) => {
            this.searchTerm = term;
            this.dt.reset();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getEmptyMaterial(): Material {
        return {
            id: 0,
            nombre: '',
            numero_factura: 0,
            referencia: '',
            precio_unitario: 0,
            stock: 0
        };
    }

    loadMaterials(event: TableLazyLoadEvent) {
        this.lastTableEvent = event;
        this.loading = true;

        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const hasFilters = this.searchTerm || 
                           this.stockMaximoFilter !== null || 
                           this.precioMinimoFilter !== null || 
                           this.precioMaximoFilter !== null;

        const filterParams: MaterialFilter = {
            texto: this.searchTerm, 
            stock_maximo: this.stockMaximoFilter || undefined,
            precio_minimo: this.precioMinimoFilter || undefined,
            precio_maximo: this.precioMaximoFilter || undefined
        };

        const requestObservable = hasFilters
            ? this.materialService.searchMaterial(filterParams, page, size)
            : this.materialService.getMaterials(page, size);

        this.currentRequest = requestObservable
            .pipe(
                delay(0),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.materials = response.content;
                    this.totalRecords = response.totalElements;
                },
                error: () => {
                   
                }
            });
    }

    applyFilters() {
        const filters: ActiveFilter[] = [];

        if (this.stockMaximoFilter !== null) {
            filters.push({
                key: 'stock',
                label: `Stock Máx: ${this.stockMaximoFilter}`,
                value: this.stockMaximoFilter
            });
        }

        if (this.precioMinimoFilter !== null) {
            filters.push({
                key: 'minPrice',
                label: `Precio Mín: ${this.precioMinimoFilter}€`,
                value: this.precioMinimoFilter
            });
        }

        if (this.precioMaximoFilter !== null) {
            filters.push({
                key: 'maxPrice',
                label: `Precio Máx: ${this.precioMaximoFilter}€`,
                value: this.precioMaximoFilter
            });
        }

        this.activeFilters = filters;
        this.dt.reset();
    }

    clearFilters() {
        this.searchTerm = '';
        this.stockMaximoFilter = null;
        this.precioMinimoFilter = null;
        this.precioMaximoFilter = null;
        this.activeFilters = [];
        this.dt.reset();
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    openNew() {
        this.material = this.getEmptyMaterial();
        this.submitted = false;
        this.dialogTitle = 'Nuevo Material';
        this.materialDialog = true;
        this.cdr.markForCheck(); 
    }

    editMaterial(mat: Material) {
        this.material = { ...mat };
        this.dialogTitle = 'Editar Material';
        this.materialDialog = true;
        this.cdr.markForCheck();
    }

    saveMaterial() {
        this.submitted = true;

        if (!this.material.nombre.trim()) {
            this.cdr.markForCheck();
            return;
        }
        if (!this.material.referencia.trim()) {
            this.cdr.markForCheck();
            return;
        }

        const request = this.material.id
            ? this.materialService.update(this.material)
            : this.materialService.create(this.material);

        request.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación realizada' });
                this.materialDialog = false;
                this.reloadCurrentPage();
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
                this.cdr.markForCheck();
            }
        });
    }

    deleteMaterial(mat: Material) {
        this.confirmationService.confirm({
            message: `¿Eliminar ${mat.nombre}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.materialService.delete(mat.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado' });
                        this.reloadCurrentPage();
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
                        this.cdr.markForCheck();
                    }
                });
            }
        });
    }

    hideDialog() {
        this.materialDialog = false;
        this.submitted = false;
        this.cdr.markForCheck();
    }

    reloadCurrentPage() {
        if (this.lastTableEvent) {
            this.loadMaterials(this.lastTableEvent);
        } else {
            this.dt.reset();
        }
    }
}