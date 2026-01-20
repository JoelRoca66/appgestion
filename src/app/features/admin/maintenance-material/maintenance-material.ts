import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core'; 
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
import { MaterialService } from '../../../core/services/material.service'; 
import { Material } from '../../../core/models/material.model';
import { MaterialFilter } from '../../../core/models/materialFilter.model';

@Component({
  selector: 'app-maintenance-material',
  imports: [ 
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, 
    ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule, 
    ToolbarModule, SelectModule, PopoverModule 
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-material.html',
  styleUrl: './maintenance-material.css',
  changeDetection: ChangeDetectionStrategy.OnPush // <--- ESTRATEGIA ONPUSH
})
export class MaintenanceMaterial implements OnInit {

  @ViewChild('dt') dt!: Table;

  materials: Material[] = [];
  
  totalRecords: number = 0;
  loading: boolean = true; 
  lastTableEvent: TableLazyLoadEvent | null = null;
  
  searchTerm: string = '';
  facturaFilter: string = '';
  referenciaFilter: string = '';

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
  ) {}

  ngOnInit() {
      this.loading = true;
  }

  getEmptyMaterial(): Material {
      return { 
          id: 0, 
          nombre: '', 
          num_factura: '', 
          referencia: '', 
          precio_unitario: 0, 
          stock: 0 
      };
  }

  loadMaterials(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    
    // Eliminado setTimeout
    this.loading = true;
    
    if (this.currentRequest) {
        this.currentRequest.unsubscribe();
    }

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    const hasFilters = this.searchTerm || this.facturaFilter || this.referenciaFilter;

    const filterParams: MaterialFilter = {
        term: this.searchTerm,
        num_factura: this.facturaFilter,
        referencia: this.referenciaFilter
    };

    const requestObservable = hasFilters
        ? this.materialService.searchMaterial(filterParams, page, size)
        : this.materialService.getMaterials(page, size);

    this.currentRequest = requestObservable.subscribe({
        next: (response) => {
            this.materials = response.content;
            this.totalRecords = response.totalElements;
            this.loading = false;
            this.cdr.markForCheck(); // <--- ACTUALIZACIÓN MANUAL
        },
        error: () => {
            this.loading = false;
            this.cdr.markForCheck(); // <--- ACTUALIZACIÓN MANUAL
        }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.dt.reset(); 
  }

  applyFilters() {
      this.dt.reset();
  }

  clearFilters() {
      this.searchTerm = '';
      this.facturaFilter = '';
      this.referenciaFilter = '';
      this.dt.reset();
  }

  openNew() {
    this.material = this.getEmptyMaterial();
    this.submitted = false;
    this.dialogTitle = 'Nuevo Material';
    this.materialDialog = true;
    this.cdr.markForCheck(); // <--- Para mostrar el diálogo
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