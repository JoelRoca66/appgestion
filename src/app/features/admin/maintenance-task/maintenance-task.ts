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

import { ConfirmationService, MessageService } from 'primeng/api';


@Component({
  selector: 'app-maintenance-task',
  imports: [ CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule, ToolbarModule, SelectModule, PopoverModule ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-task.html',
  styleUrl: './maintenance-task.css',
})
export class MaintenanceTask {

}
