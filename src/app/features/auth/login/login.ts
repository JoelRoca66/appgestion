import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, CardModule, ButtonModule, InputTextModule, PasswordModule, FloatLabelModule, CheckboxModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  usuario: string = '';
  password: string = '';
  recordar: boolean = false;
  loading: boolean = false;

  onLogin() {
    this.loading = true;
    setTimeout(() => this.loading = false, 2000);
  }
}
