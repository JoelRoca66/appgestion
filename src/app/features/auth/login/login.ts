import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HttpClientModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    CheckboxModule,
    ToastModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'], 
})
export class Login {

  usuario: string = '';
  contrasena: string = '';
  recordar: boolean = false;
  loading: boolean = false;

  passwordDialog: boolean = false;
  dialogTitle: string = 'Cambiar Contraseña';
  submitted: boolean = false;
  confirmPassword: string = '';

  user: User = {} as User;

  constructor(
    private authService: AuthService,
    private storage: StorageService,
    private router: Router,
    private messageService: MessageService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}


  onLogin() {
    if (!this.usuario || !this.contrasena) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Completa todos los campos' 
      });
      return;
    }

    this.loading = true;

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (userResponse: User) => {
        this.loading = false;
        this.user = { ...userResponse };

        const userToStore = { ...this.user };
        delete userToStore.contrasena;
        
        this.storage.setItem('currentUser', JSON.stringify(userToStore), this.recordar);

        if (!this.user.cambio_contrasena) {
          this.user.contrasena = '';
          this.submitted = false;
          this.confirmPassword = '';

          setTimeout(() => {
            this.passwordDialog = true;
            this.cdr.detectChanges();
          }, 0);
        } else {
          this.navigateBasedOnRole(this.user);
        }
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Usuario o contraseña incorrectos'
        });
      }
    });
  }

  showPasswordDialog() {
    this.submitted = false;
    this.confirmPassword = '';
    this.passwordDialog = true;
    this.cdr.detectChanges();
  }

  hideDialog() {
    this.passwordDialog = false;
    this.submitted = false;
  }

  savePassword() {
    this.submitted = true;

    if (!this.user.contrasena || !this.confirmPassword) {
      return;
    }

    if (this.user.contrasena !== this.confirmPassword) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Las contraseñas no coinciden' 
      });
      return;
    }

    this.user.cambio_contrasena = true;

    this.authService.updatePassword(this.user).subscribe({
      next: (updatedUser: User) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Contraseña actualizada' 
        });
        this.passwordDialog = false;

        const userToStore = { ...updatedUser };
        delete userToStore.contrasena;
        
        this.storage.setItem('currentUser', JSON.stringify(userToStore), this.recordar);

        this.navigateBasedOnRole(updatedUser);
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo actualizar la contraseña' 
        });
      }
    });
  }

  navigateBasedOnRole(user: User) {
    const isAdmin = user.rol === true;
    const targetRoute = isAdmin ? '/admin/dashboard' : '/user/home';
        
    this.zone.run(() => {
      this.router.navigate([targetRoute]);
    });
  }
}