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
import { CheckboxModule } from 'primeng/checkbox';

import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-maintenance-user',
  imports: [CommonModule, FormsModule, TableModule, CheckboxModule, ButtonModule, DialogModule, ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule, ToolbarModule, SelectModule, PopoverModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-user.html',
  styleUrl: './maintenance-user.css',
})
export class MaintenanceUser {

  @ViewChild('dt') dt!: Table;

  usuarios: User[] = [];
  
  totalRecords: number = 0;
  loading: boolean = true; 
  lastTableEvent: TableLazyLoadEvent | null = null;
  searchTerm: string = '';

  private currentRequest: Subscription | null = null;

  categoryDialog: boolean = false;
  user: User = { id: 0, usuario: '', password: '', isAdmin: false };
  submitted: boolean = false;
  dialogTitle: string = '';

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private userService: UserService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
      this.loading = true;
  }

  loadUsers(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    
    setTimeout(() => {
        this.loading = true;
        if (this.currentRequest) {
            this.currentRequest.unsubscribe();
        }

        const page = (event.first ?? 0) / (event.rows ?? 10);
        const size = event.rows ?? 10;

        const requestObservable = this.searchTerm 
            ? this.userService.searchUser(this.searchTerm, page, size)
            : this.userService.getUsers(page, size);

        this.currentRequest = requestObservable.subscribe({
            next: (response) => {
                this.usuarios = response.content;
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
    this.user = { id: 0, usuario: '', password: '', isAdmin: false };
    this.submitted = false;
    this.dialogTitle = 'Nuevo Usuario';
    this.categoryDialog = true;
  }

  editUser(user: User) {
    this.user = { ...user };
    this.dialogTitle = 'Editar Usuario';
    this.categoryDialog = true;
  }

  saveUser() {
    this.submitted = true;
    if (!this.user.usuario.trim()) return;
    
    if (this.user.password.length < 8) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La contraseña debe tener al menos 8 caracteres' });
        return; 
    }

    const request = this.user.id 
        ? this.userService.update(this.user) 
        : this.userService.create(this.user);

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

  deleteUser(user: User) {
    this.confirmationService.confirm({
      message: `¿Eliminar ${user.usuario}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.delete(user.id).subscribe({
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
        this.loadUsers(this.lastTableEvent);
    } else {
        this.dt.reset();
    }
  }
}