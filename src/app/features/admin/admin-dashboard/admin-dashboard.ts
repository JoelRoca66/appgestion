import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, TableModule, TagModule, CardModule, ButtonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  users: User[] = [];

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    return status === 'Alta' ? 'success' : 'danger';
  }
}
