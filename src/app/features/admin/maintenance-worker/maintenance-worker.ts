import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, delay, finalize, takeUntil, filter } from 'rxjs/operators';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkerService } from '../../../core/services/worker.service';
import { CategoryService } from '../../../core/services/category.service';
import { Worker } from '../../../core/models/worker.model';
import { Category, CategoryDTO } from '../../../core/models/category.model';
import { WorkerFilter } from '../../../core/models/workerFilter.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

interface ActiveFilter {
    key: string;
    label: string;
    value: any;
}

@Component({
    selector: 'app-maintenance-worker',
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule, ConfirmDialogModule,
        ToastModule, InputTextModule, InputNumberModule, ToolbarModule,
        SelectModule, PopoverModule, PasswordModule, CheckboxModule, DividerModule, ChipModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './maintenance-worker.html',
    styleUrl: './maintenance-worker.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceWorker implements OnInit {

    @ViewChild('dt') dt!: Table;

    workers: Worker[] = [];

    estados: any[] = [
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Baja', value: 'BAJA' },
        { label: 'Inactivo', value: 'INACTIVO' }
    ];
    categorias: CategoryDTO[] = [];
    activeFilters: ActiveFilter[] = [];

    totalRecords: number = 0;

    loading: boolean = false;

    lastTableEvent: TableLazyLoadEvent | null = null;
    searchTerm: string = '';
    categoriaFilter: CategoryDTO | null = null;
    estadoFilter: string | null = null;

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private currentRequest: Subscription | null = null;

    workerDialog: boolean = false;
    worker: Worker = this.getEmptyWorker();

    submitted: boolean = false;
    dialogTitle: string = '';

    userDialog: boolean = false;
    newUser: User = { id_trabajador: 0, usuario: '', contrasena: '', rol: false };

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private workerService: WorkerService,
        private categoryService: CategoryService,
        private cdr: ChangeDetectorRef,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.loadCategoriasForDropdown();

        this.searchSubject.pipe(
            debounceTime(750),
            distinctUntilChanged(),
            filter(texto => texto.length >= 3 || texto.length === 0),
            takeUntil(this.destroy$)
        ).subscribe((term) => {
            this.searchTerm = term;
            this.dt.reset();
        });
    }

    loadCategoriasForDropdown() {
        this.categoryService.getCategoriasDTO().subscribe({
            next: (resp) => {
                this.categorias = resp;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error cargando categorías', err);
                this.cdr.markForCheck();
            }
        });
    }

    getEmptyWorker(): Worker {
        return {
            id: 0,
            nombre: '',
            apellido: '',
            dni: '',
            estado: 'ACTIVO',
            id_categoria: { id: 0, nombre: '', precio_hora_coste: 0, precio_hora_trabajador: 0 }
        };
    }

    loadWorkers(event: TableLazyLoadEvent) {
        this.lastTableEvent = event;
        this.loading = true;

        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const catId = this.categoriaFilter ? this.categoriaFilter.id : 0;
        const estadoVal = this.estadoFilter ? this.estadoFilter : '';
        const hasFilters = this.searchTerm || catId > 0 || estadoVal !== '';

        const filterParams: WorkerFilter = {
            term: this.searchTerm,
            categoriaId: catId,
            estado: estadoVal
        };

        const requestObservable = hasFilters
            ? this.workerService.searchWorker(filterParams, page, size)
            : this.workerService.getWorkers(page, size);

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
                    this.workers = response.content;
                    this.totalRecords = response.totalElements;
                },
                error: () => {
                }
            });
    }

    applyFilters() {
        const filters: ActiveFilter[] = [];

        if (this.estadoFilter) {
            const estadoLabel = this.estados.find(e => e.value === this.estadoFilter)?.label || this.estadoFilter;
            filters.push({
                key: 'estado',
                label: `Estado: ${estadoLabel}`,
                value: this.estadoFilter
            });
        }

        if (this.categoriaFilter) {
            const categoriaLabel = this.categorias.find(c => c.id === this.categoriaFilter!.id)?.nombre || this.categoriaFilter!.id;
            filters.push({
                key: 'categoria',
                label: `Categoría: ${categoriaLabel}`,
                value: this.categoriaFilter
            });
        }

        this.activeFilters = filters;
        this.dt.reset();
    }

    clearFilters() {
        this.searchTerm = '';
        this.categoriaFilter = null;
        this.estadoFilter = null;
        this.activeFilters = [];
        this.dt.reset();
    }

    onSearch(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    openNew() {
        this.worker = this.getEmptyWorker();
        this.submitted = false;
        this.dialogTitle = 'Nuevo Trabajador';
        this.workerDialog = true;
        this.cdr.markForCheck();
    }

    editWorker(w: Worker) {
        this.worker = { ...w };
        const workerData = w as any;
        const categoriaData = workerData.id_categoria;
        if (categoriaData && categoriaData.id) {
            const foundCat = this.categorias.find(c => c.id === categoriaData.id);
            if (foundCat) {
                this.worker.id_categoria = foundCat as unknown as Category;
            }
        }

        this.dialogTitle = 'Editar Trabajador';
        this.workerDialog = true;
        this.cdr.markForCheck();
    }

    saveWorker() {
        this.submitted = true;

        if (!this.worker.nombre.trim()) {
            this.cdr.markForCheck();
            return;
        }
        if (!this.worker.id_categoria || !this.worker.id_categoria.id) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una categoría' });
            this.cdr.markForCheck();
            return;
        }

        if (this.worker.id) {
            this.workerService.update(this.worker).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación realizada' });
                    this.workerDialog = false;
                    this.reloadCurrentPage();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
                    this.cdr.markForCheck();
                }
            });
        } else {
            this.workerService.create(this.worker).subscribe({
                next: (workerCreado) => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Trabajador creado. Asigne usuario.' });

                    this.workerDialog = false;
                    this.reloadCurrentPage();

                    this.openUserCreationDialog(workerCreado);
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear (Revise consola)' });
                    this.cdr.markForCheck();
                }
            });
        }
    }

    deleteWorker(worker: Worker) {
        this.confirmationService.confirm({
            message: `¿Eliminar ${worker.nombre}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.workerService.delete(worker.id).subscribe({
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
        this.workerDialog = false;
        this.submitted = false;
        this.cdr.markForCheck();
    }

    reloadCurrentPage() {
        if (this.lastTableEvent) {
            this.loadWorkers(this.lastTableEvent);
        } else {
            this.dt.reset();
        }
    }

    openUserCreationDialog(workerLinked: Worker) {
        this.newUser = {
            id_trabajador: 0,
            usuario: '',
            contrasena: '',
            rol: false,
            worker: workerLinked
        };
        this.userDialog = true;
        this.cdr.markForCheck();
    }

    saveUser() {
        if (!this.newUser.usuario || !this.newUser.contrasena) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Usuario y contraseña requeridos' });
            this.cdr.markForCheck();
            return;
        }

        this.newUser.id_trabajador = this.newUser.worker ? this.newUser.worker.id : 0;

        this.userService.create(this.newUser).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Proceso Finalizado', detail: 'Usuario creado y asignado' });
                this.userDialog = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear usuario. El trabajador sí se creó.' });
                this.cdr.markForCheck();
            }
        });
    }

    skipUserCreation() {
        this.userDialog = false;
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Trabajador creado sin usuario asignado' });
        this.cdr.markForCheck();
    }
}