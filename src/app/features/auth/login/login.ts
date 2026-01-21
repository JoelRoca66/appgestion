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
import { MessageService } from 'primeng/api';
import { AuthService } from './../../../core/services/auth.service';
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
    HttpClientModule 
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onLogin() {
    if (!this.usuario || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Completa todos los campos' });
      return;
    }

    this.loading = true;
    this.authService.login(this.usuario, this.password).subscribe({
      next: (user: User) => {
        this.loading = false;
        
        if(this.recordar) {
             localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
             sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
        if (user.rol === true) {
          this.router.navigate(['/admin/dashboard']); 
        } else {
          this.router.navigate(['/portal/home']); 
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
}