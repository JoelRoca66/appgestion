
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

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

@Component({
  selector: 'app-maintenance-worker',
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule,
    ToolbarModule, SelectModule, PopoverModule, PasswordModule, CheckboxModule,
    DividerModule, ChipModule
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

  totalRecords = 0;
  loading = false;
  rol = false;

  lastTableEvent: TableLazyLoadEvent | null = null;

  searchTerm = '';
  /** Filtro de categoría como ID numérico (o null si no se aplica) */
  idCategoriaFilter: number | null = null;
  estadoFilter: string | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest: Subscription | null = null;

  workerDialog = false;
  worker: Worker = this.getEmptyWorker();
  submitted = false;
  dialogTitle = '';

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private workerService: WorkerService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCategoriasForDropdown();

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

  loadCategoriasForDropdown() {
    this.categoryService.getCategoriasDTO().subscribe({
      next: resp => {
        this.categorias = resp;
        this.cdr.markForCheck();
      },
      error: err => {
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
      id_categoria: {
        id: 0,
        nombre: '',
        precio_hora_coste: 0,
        precio_hora_trabajador: 0
      }
    };
  }

  loadWorkers(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    this.loading = true;
    this.cdr.markForCheck();

    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
      this.currentRequest = null;
    }

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    const catId = this.idCategoriaFilter ?? null; // null si no hay filtro
    const estadoVal = this.estadoFilter ?? '';

    const hasFilters =
      (this.searchTerm?.trim().length ?? 0) > 0 ||
      catId !== null ||
      estadoVal !== '';

    const filterParams: WorkerFilter = {
      texto: this.searchTerm?.trim() ?? '',
      estado: estadoVal,
      id_categoria: catId
    };

    const request$ = hasFilters
      ? this.workerService.searchWorker(filterParams, page, size)
      : this.workerService.getWorkers(page, size);

    // console.log('[loadWorkers] filtros enviados:', filterParams);

    this.currentRequest = request$
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          // Forzar nueva referencia para OnPush
          this.workers = [...response.content];
          this.totalRecords = response.totalElements;

          if (response.totalElements === 0) {
            this.workers = [];
            this.dt?.clear();
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilters() {
    const filters: ActiveFilter[] = [];

    if (this.estadoFilter) {
      const estadoLabel =
        this.estados.find(e => e.value === this.estadoFilter)?.label || this.estadoFilter;

      filters.push({
        key: 'estado',
        label: `Estado: ${estadoLabel}`,
        value: this.estadoFilter
      });
    }

    if (this.idCategoriaFilter !== null) {
      const categoriaLabel =
        this.categorias.find(c => c.id === this.idCategoriaFilter)?.nombre || this.idCategoriaFilter;

      filters.push({
        key: 'categoria',
        label: `Categoría: ${categoriaLabel}`,
        value: this.idCategoriaFilter
      });
    }

    this.activeFilters = filters;
    this.dt.reset();
  }

  clearFilters() {
    this.searchTerm = '';
    this.idCategoriaFilter = null;
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

    const categoriaData: any = (w as any).id_categoria;
    if (categoriaData?.id) {
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

    if (!this.worker.id_categoria?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una categoría'
      });
      this.cdr.markForCheck();
      return;
    }

    const request$ = this.worker.id
      ? this.workerService.update(this.worker)
      : this.workerService.create(this.worker, this.rol);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Operación realizada'
        });
        this.workerDialog = false;
        this.reloadCurrentPage();
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar'
        });
        this.cdr.markForCheck();
      }
    });
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
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Eliminado'
            });
            this.reloadCurrentPage();
            this.cdr.markForCheck();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar'
            });
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
}

