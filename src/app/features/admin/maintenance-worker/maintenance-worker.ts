import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs'; 
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkerService } from '../../../core/services/worker.service'; 
import { CategoryService } from '../../../core/services/category.service'; 
import { Worker } from '../../../core/models/worker.model';
import { Category, CategoryDTO } from '../../../core/models/category.model'; 
import { WorkerFilter } from '../../../core/models/workerFilter.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-maintenance-worker',
  imports: [
    CommonModule, FormsModule, 
    TableModule, ButtonModule, DialogModule, ConfirmDialogModule, 
    ToastModule, InputTextModule, InputNumberModule, ToolbarModule,
    SelectModule, PopoverModule, PasswordModule, CheckboxModule 
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

  private searchSubject = new Subject<string>();
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
  ) {}

  ngOnInit() {
      this.loading = true;
      this.loadCategoriasForDropdown(); 

      this.searchSubject.pipe(
        debounceTime(300),        
        distinctUntilChanged()   
      ).subscribe((term) => {
        this.searchTerm = term;  
        this.dt.reset();          
      });
  }

  loadCategoriasForDropdown() {
      this.categoryService.getCategoriasDTO().subscribe({
          next: (resp) => {
              this.categorias = resp;
              this.cdr.detectChanges(); 
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
          id_categoria: { id: 0, nombre: '', precio_hora_coste: 0, precio_hora_trabajador: 0 } 
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

        const hasFilters = this.searchTerm || catId > 0 || estadoVal !== '';

        const filterParams: WorkerFilter = {
            term: this.searchTerm,
            categoriaId: catId,
            estado: estadoVal
        };

        const requestObservable = hasFilters
            ? this.workerService.searchWorker(filterParams, page, size)
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
    this.searchSubject.next(value);
  }

  openNew() {
    this.worker = this.getEmptyWorker();
    this.submitted = false;
    this.dialogTitle = 'Nuevo Trabajador';
    this.workerDialog = true;
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
  }

  saveWorker() {
    this.submitted = true;
    if (!this.worker.nombre.trim()) return;
    if (!this.worker.id_categoria || !this.worker.id_categoria.id) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una categoría' });
        return;
    }
    
    if (this.worker.id) {
        this.workerService.update(this.worker).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación realizada' });
                this.workerDialog = false;
                this.reloadCurrentPage();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
            }
        });
    } else {
        this.workerService.create(this.worker).subscribe({
            next: (workerCreado) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Trabajador creado. Asigne usuario.' });
                
                this.workerDialog = false;
                this.reloadCurrentPage();

                this.openUserCreationDialog(workerCreado);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear (Revise consola)' });
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

  openUserCreationDialog(workerLinked: Worker) {
      this.newUser = { 
          id_trabajador: 0, 
          usuario: '', 
          contrasena: '', 
          rol: false,
          worker: workerLinked 
      };
      this.userDialog = true;
  }

  saveUser() {
      if (!this.newUser.usuario || !this.newUser.contrasena) {
          this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Usuario y contraseña requeridos' });
          return;
      }

      this.newUser.id_trabajador = this.newUser.worker ? this.newUser.worker.id : 0;

      console.log('Creando usuario:', this.newUser);

      this.userService.create(this.newUser).subscribe({
          next: () => {
              this.messageService.add({ severity: 'success', summary: 'Proceso Finalizado', detail: 'Usuario creado y asignado' });
              this.userDialog = false;
          },
          error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear usuario. El trabajador sí se creó.' });
          }
      });
  }

  
  skipUserCreation() {
      this.userDialog = false;
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Trabajador creado sin usuario asignado' });
  }
}
