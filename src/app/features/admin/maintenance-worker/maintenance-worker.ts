import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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

import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkerService } from '../../../core/services/worker.service'; 
import { CategoryService } from '../../../core/services/category.service'; 
import { Worker } from '../../../core/models/worker.model';
import { Category, CategoryDTO } from '../../../core/models/category.model'; 

@Component({
  selector: 'app-maintenance-worker',
  imports: [
    CommonModule, FormsModule, 
    TableModule, ButtonModule, DialogModule, ConfirmDialogModule, 
    ToastModule, InputTextModule, InputNumberModule, ToolbarModule,
    SelectModule, PopoverModule 
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-worker.html',
  styleUrl: './maintenance-worker.css',
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

  totalRecords: number = 0;
  loading: boolean = true; 
  lastTableEvent: TableLazyLoadEvent | null = null;
  
  searchTerm: string = '';
  categoriaFilter: CategoryDTO | null = null; 
  estadoFilter: string | null = null;   

  private currentRequest: Subscription | null = null;

  workerDialog: boolean = false;
  worker: Worker = this.getEmptyWorker();
  
  submitted: boolean = false;
  dialogTitle: string = '';

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private workerService: WorkerService,
    private categoryService: CategoryService, 
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
      this.loading = true;
      this.loadCategoriasForDropdown(); 
  }

  loadCategoriasForDropdown() {
      this.categoryService.getCategoriasDTO().subscribe({
          next: (resp) => {
              this.categorias = resp; 
          },
          error: (err) => console.error('Error cargando categorías', err)
      });
  }

  getEmptyWorker(): Worker {
      return { 
          id: 0, 
          nombre: '', 
          apellido: '', 
          dni: '', 
          estado: 'ACTIVO', 
          categoria: { id: 0, nombre: '', precio_hora_coste: 0, precio_hora_trabajador: 0 } 
      };
  }

  loadWorkers(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    
    setTimeout(() => {
        this.loading = true;
        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const catId = this.categoriaFilter ? this.categoriaFilter.id : 0;
        const estadoVal = this.estadoFilter ? this.estadoFilter : '';

        const requestObservable = (this.searchTerm || catId || estadoVal)
            ? this.workerService.searchWorker({
                term: this.searchTerm, 
                categoriaId: catId, 
                estado: estadoVal
              }, page, size)
            : this.workerService.getWorkers(page, size);

        this.currentRequest = requestObservable.subscribe({
            next: (response) => {
                this.workers = response.content;
                this.totalRecords = response.totalElements;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }, 0);
  }

  applyFilters() {
      this.dt.reset();
  }

  clearFilters() {
      this.searchTerm = '';
      this.categoriaFilter = null;
      this.estadoFilter = null;
      this.dt.reset();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.dt.reset(); 
  }

  openNew() {
    this.worker = this.getEmptyWorker();
    this.submitted = false;
    this.dialogTitle = 'Nuevo Trabajador';
    this.workerDialog = true;
  }

  editWorker(w: Worker) {
    this.worker = { ...w }; 
    
    if (this.worker.categoria && this.worker.categoria.id) {
        const foundCat = this.categorias.find(c => c.id === this.worker.categoria.id);
        if (foundCat) {
            this.worker.categoria = foundCat as unknown as Category;
        }
    }

    this.dialogTitle = 'Editar Trabajador';
    this.workerDialog = true;
  }

  saveWorker() {
    this.submitted = true;
    if (!this.worker.nombre.trim()) return;
    
    if (!this.worker.categoria || !this.worker.categoria.id) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una categoría' });
        return;
    }

    const request = this.worker.id 
        ? this.workerService.update(this.worker) 
        : this.workerService.create(this.worker);

    request.subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación realizada' });
            this.workerDialog = false;
            this.reloadCurrentPage();
        },
        error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
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
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Eliminado' });
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
    this.workerDialog = false;
    this.submitted = false;
  }

  reloadCurrentPage() {
    if (this.lastTableEvent) {
        this.loadWorkers(this.lastTableEvent);
    } else {
        this.dt.reset();
    }
  }
}