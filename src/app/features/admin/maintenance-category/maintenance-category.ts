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

import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../../core/services/category.service'; 
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-maintenance-category',
  imports: [
    CommonModule, FormsModule, 
    TableModule, ButtonModule, DialogModule, ConfirmDialogModule, 
    ToastModule, InputTextModule, InputNumberModule, ToolbarModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-category.html',
  styleUrl: './maintenance-category.css',
})
export class MaintenanceCategory implements OnInit {
  @ViewChild('dt') dt!: Table;

  categorias: Category[] = [];
  
  totalRecords: number = 0;
  loading: boolean = true; 
  lastTableEvent: TableLazyLoadEvent | null = null;
  searchTerm: string = '';

  private currentRequest: Subscription | null = null;

  categoryDialog: boolean = false;
  category: Category = { id: 0, nombre: '', precio_hora_coste: 0, precio_hora_trabajador: 0 };
  submitted: boolean = false;
  dialogTitle: string = '';

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
      this.loading = true;
  }

  loadCategories(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    
    setTimeout(() => {
        this.loading = true;
        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const requestObservable = this.searchTerm 
            ? this.categoryService.searchCategoria(this.searchTerm, page, size)
            : this.categoryService.getCategorias(page, size);

        this.currentRequest = requestObservable.subscribe({
            next: (response) => {
                this.categorias = response.content;
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

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.dt.reset(); 
  }

  openNew() {
    this.category = { id: 0, nombre: '', precio_hora_coste: 0, precio_hora_trabajador: 0 };
    this.submitted = false;
    this.dialogTitle = 'Nueva Categoría';
    this.categoryDialog = true;
  }

  editCategory(cat: Category) {
    this.category = { ...cat };
    this.dialogTitle = 'Editar Categoría';
    this.categoryDialog = true;
  }

  saveCategory() {
    this.submitted = true;
    if (!this.category.nombre.trim()) return;
    
    if (this.category.precio_hora_coste < this.category.precio_hora_trabajador) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Coste debe ser >= Trabajador' });
        return; 
    }

    const request = this.category.id 
        ? this.categoryService.update(this.category) 
        : this.categoryService.create(this.category);

    request.subscribe({
        next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación realizada' });
            this.categoryDialog = false;
            this.reloadCurrentPage();
        },
        error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        }
    });
  }

  deleteCategory(cat: Category) {
    this.confirmationService.confirm({
      message: `¿Eliminar ${cat.nombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.categoryService.delete(cat.id).subscribe({
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
    this.categoryDialog = false;
    this.submitted = false;
  }

  reloadCurrentPage() {
    if (this.lastTableEvent) {
        this.loadCategories(this.lastTableEvent);
    } else {
        this.dt.reset();
    }
  }
}