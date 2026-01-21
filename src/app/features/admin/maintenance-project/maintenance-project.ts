import {
    Component,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil, filter } from 'rxjs/operators';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ProjectFilter } from '../../../core/models/projectFilter.model';

interface ActiveFilter {
    key: string;
    label: string;
    value: any;
}

@Component({
    selector: 'app-maintenance-project',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
        ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule,
        TextareaModule, ToolbarModule, SelectModule, PopoverModule, CheckboxModule,
        ChipModule, DatePickerModule, ProgressBarModule, TagModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './maintenance-project.html',
    styleUrl: './maintenance-project.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceProject implements OnInit {

    @ViewChild('dt') dt!: Table;

    projects: Project[] = [];

    estados: any[] = [
        { label: 'En Progreso', value: 'EN_PROGRESO' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'Completado', value: 'COMPLETADO' },
        { label: 'Cancelado', value: 'CANCELADO' }
    ];

    activeFilters: ActiveFilter[] = [];

    totalRecords = 0;
    loading = false;
    lastTableEvent: TableLazyLoadEvent | null = null;
    searchTerm = '';

    filterEstado: string | null = null;
    filterMargenMin: number | null = null;
    filterFechaIniDesde: Date | null = null;
    filterFechaIniHasta: Date | null = null;

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private currentRequest: Subscription | null = null;

    projectDialog = false;
    project: Project = this.getEmptyProject();
    submitted = false;
    dialogTitle = '';

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private projectService: ProjectService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.searchSubject.pipe(
            debounceTime(750),
            distinctUntilChanged(),
            filter(texto => texto.length >= 3 || texto.length === 0),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.searchTerm = term;
            this.dt.reset();
        });
    }

    getEmptyProject(): Project {
        return {
            id: 0,
            nombre: '',
            descripcion: '',
            estado: 'PENDIENTE',
            fechaIni: new Date(), 
            fechaFin: undefined,
            margenBeneficio: 0,
            totalTareas: 0,
            tareasCompletadas: 0
        };
    }

    loadProjects(event: TableLazyLoadEvent) {
        this.lastTableEvent = event;
        this.loading = true;
        this.cdr.markForCheck();

        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
            this.currentRequest = null;
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const hasFilters = this.searchTerm ||
            this.filterEstado ||
            this.filterMargenMin ||
            this.filterFechaIniDesde ||
            this.filterFechaIniHasta;

        const filterParams: ProjectFilter = {
            texto: this.searchTerm,
            estado: this.filterEstado ?? undefined,
            margenBeneficioMin: this.filterMargenMin ?? undefined,
            fecha_inicio_desde: this.filterFechaIniDesde ?? undefined,
            fecha_inicio_hasta: this.filterFechaIniHasta ?? undefined
        };

        const request$ = hasFilters
            ? this.projectService.searchProject(filterParams, page, size)
            : this.projectService.getProjects(page, size);

        this.currentRequest = request$
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: response => {
                    this.projects = response.content.map(p => ({
                        ...p,
                        fechaIni: new Date(p.fechaIni),
                        fechaFin: p.fechaFin ? new Date(p.fechaFin) : undefined
                    }));
                    this.totalRecords = response.totalElements;
                },
                error: () => {
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    applyFilters() {
        const filters: ActiveFilter[] = [];

        if (this.filterEstado) {
            const label = this.estados.find(e => e.value === this.filterEstado)?.label || this.filterEstado;
            filters.push({ key: 'estado', label: `Estado: ${label}`, value: this.filterEstado });
        }

        if (this.filterMargenMin) {
            filters.push({ key: 'margen', label: `Margen Min: ${this.filterMargenMin}%`, value: this.filterMargenMin });
        }

        if (this.filterFechaIniDesde) {
            filters.push({
                key: 'fDesde',
                label: `Desde: ${this.filterFechaIniDesde.toLocaleDateString()}`,
                value: this.filterFechaIniDesde
            });
        }

        if (this.filterFechaIniHasta) {
            filters.push({
                key: 'fHasta',
                label: `Hasta: ${this.filterFechaIniHasta.toLocaleDateString()}`,
                value: this.filterFechaIniHasta
            });
        }

        this.activeFilters = filters;
        this.dt.reset();
    }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = null;
        this.filterMargenMin = null;
        this.filterFechaIniDesde = null;
        this.filterFechaIniHasta = null;
        this.activeFilters = [];
        this.dt.reset();
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    openNew() {
        this.project = this.getEmptyProject();
        this.submitted = false;
        this.dialogTitle = 'Nuevo Proyecto';
        this.projectDialog = true;
        this.cdr.markForCheck();
    }

    editProject(p: Project) {
        this.project = {
            ...p,
            fechaIni: new Date(p.fechaIni),
            fechaFin: p.fechaFin ? new Date(p.fechaFin) : undefined
        };
        this.dialogTitle = 'Editar Proyecto';
        this.projectDialog = true;
        this.cdr.markForCheck();
    }

    saveProject() {
        this.submitted = true;

        // Validaciones básicas
        if (!this.project.nombre.trim() || !this.project.fechaIni) {
            this.cdr.markForCheck();
            return;
        }

        const request$ = this.project.id
            ? this.projectService.updateProject(this.project)
            : this.projectService.createProject(this.project);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Proyecto guardado correctamente'
                });
                this.projectDialog = false;
                this.reloadCurrentPage();
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar el proyecto'
                });
                this.cdr.markForCheck();
            }
        });
    }

    deleteProject(project: Project) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el proyecto "${project.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.projectService.deleteProject(project.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminado',
                            detail: 'Proyecto eliminado'
                        });
                        this.reloadCurrentPage();
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el proyecto'
                        });
                        this.cdr.markForCheck();
                    }
                });
            }
        });
    }

    hideDialog() {
        this.projectDialog = false;
        this.submitted = false;
        this.cdr.markForCheck();
    }

    reloadCurrentPage() {
        if (this.lastTableEvent) {
            this.loadProjects(this.lastTableEvent);
        } else {
            this.dt.reset();
        }
    }
    getProgreso(p: Project): number {
        if (!p.totalTareas || p.totalTareas === 0) return 0;
        return Math.round(((p.tareasCompletadas || 0) / p.totalTareas) * 100);
    }
    
    getSeverity(estado: string) {
        switch (estado) {
            case 'COMPLETADO': return 'success';
            case 'EN_PROGRESO': return 'info';
            case 'PENDIENTE': return 'warn';
            case 'CANCELADO': return 'danger';
            default: return 'secondary';
        }
    }
}