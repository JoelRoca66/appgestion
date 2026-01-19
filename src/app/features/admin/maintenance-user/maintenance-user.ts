import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox'; 
import { PasswordModule } from 'primeng/password';

import { MessageService } from 'primeng/api'; // ConfirmationService ya no hace falta
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-maintenance-user',
  imports: [
    CommonModule, FormsModule, TableModule, CheckboxModule, 
    ButtonModule, DialogModule, ToastModule, InputTextModule, PasswordModule
  ],
  providers: [MessageService],
  templateUrl: './maintenance-user.html',
  styleUrl: './maintenance-user.css',
})
export class MaintenanceUser implements OnInit {

  @ViewChild('dt') dt!: Table;

  usuarios: User[] = [];
  totalRecords: number = 0;
  loading: boolean = true;
  lastTableEvent: TableLazyLoadEvent | null = null;
  searchTerm: string = '';

  private currentRequest: Subscription | null = null;

  userDialog: boolean = false;
  // Inicializamos objeto limpio
  user: User = { id: 0, usuario: '', password: '', isAdmin: false };
  submitted: boolean = false;
  dialogTitle: string = '';

  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

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

  // Solo EDITAR
  editUser(user: User) {
    this.user = { ...user };
    this.dialogTitle = 'Editar Usuario';
    this.userDialog = true;
  }

  saveUser() {
    this.submitted = true;
    if (!this.user.usuario.trim()) return;

    // Solo llamamos a update, ya no hay create
    this.userService.update(this.user).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
        this.userDialog = false;
        this.reloadCurrentPage();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
      }
    });
  }

  hideDialog() {
    this.userDialog = false;
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