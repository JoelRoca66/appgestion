import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

import { AuthService } from './../../../core/services/auth.service';
import { UserService } from './../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    CheckboxModule,
    FormsModule,
    RouterLink,
    ToastModule,
    HttpClientModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  usuario: string = '';
  password: string = '';
  recordar: boolean = false;
  loading: boolean = false;

  passwordDialog: boolean = false;
  dialogTitle: string = 'Cambiar Contraseña';
  submitted: boolean = false;
  confirmPassword: string = '';

  user: User = {} as User;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) { }

  onLogin() {
    if (!this.usuario || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Completa todos los campos' });
      return;
    }

    this.loading = true;
    this.authService.login(this.usuario, this.password).subscribe({
      next: (userResponse: User) => {
        this.loading = false;

        this.user = { ...userResponse };

        if (this.recordar) {
          localStorage.setItem('currentUser', JSON.stringify(this.user));
        } else {
          sessionStorage.setItem('currentUser', JSON.stringify(this.user));
        }
        if (!this.user.cambio_contrasena) {
          this.user.contrasena = '';
          this.showPasswordDialog();
        } else {
          this.navigateBasedOnRole(this.user);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error de login', err);
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
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
      return;
    }

    this.user.cambio_contrasena = true;

    this.userService.update(this.user).subscribe({
      next: (updatedUser) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña actualizada' });
        this.passwordDialog = false;

        if (this.recordar) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }

        this.navigateBasedOnRole(updatedUser);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la contraseña' });
      }
    });
  }
  navigateBasedOnRole(user: User) {
    if (user.rol === true) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/portal/home']);
    }
  }
}