import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { RecordService } from '../../../core/services/record.service';
import { Record, RecordValidarDTO } from '../../../core/models/record.model';
import { PageResponse } from '../../../core/services/record.service';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ProjectDTO } from '../../../core/models/project.model';
import { TaskListValidarDTO } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-jornadas-no-validadas',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, ConfirmDialogModule, ToastModule, TooltipModule, DatePickerModule, CheckboxModule, DividerModule, FormsModule,
    InputNumberModule, DialogModule, SelectModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './JornadaNoValidada.html',
  styleUrl: './JornadaNoValidada.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JornadaNoValidada implements OnInit {
  @ViewChild('dt') dt!: Table;

  tasks: TaskListValidarDTO[] = [];
  projects: ProjectDTO[] = [];
  records: RecordValidarDTO[] = [];
  totalRecords = 0;
  loading = false;
  lastTableEvent: TableLazyLoadEvent | null = null;
  currentRequest: Subscription | null = null;

  loadingTasks = false;
  record: RecordValidarDTO = this.getEmptyRecord();
  selectedProjectId: number | null = null;
  selectedTaskId: number | null = null;
  recordDialog = false;


  submitted = false;

  constructor(
    private recordService: RecordService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private projectService: ProjectService
  ) { }

  ngOnInit() {
    this.loadProjectsList();
  }

  private parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;
    let d: Date;
    if (Array.isArray(dateValue)) {
      d = new Date(dateValue[0], (dateValue[1] || 1) - 1, dateValue[2] || 1, dateValue[3] || 0, dateValue[4] || 0);
    } else {
      d = new Date(dateValue);
    }
    return isNaN(d.getTime()) ? undefined : d;
  }

  getEmptyRecord(): RecordValidarDTO {
    return {
      id: 0,
      fecha: new Date(),
      horas: 0,
      validado: false,
      id_tarea: { id: 0, nombre: '', id_proyecto: 0 },
      id_trabajador: { id: 0, dni: '' }
    };
  }

  onProjectChange() {
    this.selectedTaskId = null;

    if (this.selectedProjectId) {
      this.loadTasksForProject(this.selectedProjectId);
      return;
    }

    this.tasks = [];
    this.syncRecordTaskSelection();
    this.cdr.markForCheck();
  }
  loadProjectsList() {
    this.projectService.getAllProjectNames().subscribe(res => {
      this.projects = res;
      this.cdr.markForCheck();
    });
  }

  loadTasksForProject(projectId: number) {
    this.loadingTasks = true;
    this.taskService.getAllTaskNamesFromProjectValidar(projectId).subscribe({
      next: (res) => {
        this.tasks = res;
        if (this.selectedTaskId && !this.tasks.some(t => t.id === this.selectedTaskId)) {
          this.selectedTaskId = null;
        }
        this.syncRecordTaskSelection();
        this.loadingTasks = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tasks = [];
        this.syncRecordTaskSelection();
        this.loadingTasks = false;
        this.cdr.markForCheck();
      }
    });
  }

  syncRecordTaskSelection() {
    const selectedTask = this.tasks.find(t => t.id === this.selectedTaskId);
    this.record.id_tarea = {
      id: this.selectedTaskId ?? 0,
      nombre: selectedTask?.nombre ?? '',
      id_proyecto: this.selectedProjectId ?? 0
    };
  }

  loadRecords(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    this.loading = true;
    this.cdr.markForCheck();

    if (this.currentRequest) this.currentRequest.unsubscribe();

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    this.currentRequest = this.recordService.getNoValdidas(page, size)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: PageResponse<RecordValidarDTO>) => {
          this.records = (response.content ?? []).map(r => ({
            ...r,
            fecha: this.parseDate(r.fecha) || new Date()
          }));
          this.totalRecords = response.totalElements ?? this.records.length;
        },
        error: (err) => {
          console.error('Error cargando no validadas', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las jornadas' });
        }
      });
  }

  confirmarAccion(tipo: 'validar' | 'eliminar', r: Record) {
    const esValidar = tipo === 'validar';

    this.confirmationService.confirm({
      header: esValidar ? 'Confirmar Validación' : 'Confirmar Eliminación',
      icon: esValidar ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
      message: esValidar
        ? `¿Quieres validar la jornada de ${r.horas}h del día ${new Date(r.fecha).toLocaleDateString()}?`
        : `¿Estás seguro de eliminar la jornada de ${r.horas}h del día ${new Date(r.fecha).toLocaleDateString()}?`,
      acceptButtonStyleClass: esValidar ? 'p-button-success' : 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: esValidar ? 'Validar' : 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (esValidar) {
          const actualizado: Record = { ...r, validado: true };
          this.recordService.updateRecord(actualizado).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Validada',
                detail: 'La jornada fue validada correctamente'
              });
              this.reloadCurrentPage();
            },
            error: (err) => {
              console.error('Error validando', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo validar la jornada'
              });
            }
          });
        } else {
          this.recordService.deleteRecord(r.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: 'La jornada fue eliminada correctamente'
              });
              this.reloadCurrentPage();
            },
            error: (err) => {
              console.error('Error eliminando', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la jornada'
              });
            }
          });
        }
      }
    });
  }

  reloadCurrentPage() {
    if (this.lastTableEvent) {
      this.loadRecords(this.lastTableEvent);
    } else if (this.dt) {
      this.dt.reset();
    }
  }

  saveRecord() {
    this.submitted = true;

    if (!this.selectedProjectId || !this.selectedTaskId) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Selecciona proyecto y tarea' });
      return;
    }

    this.syncRecordTaskSelection();

    if (this.record.horas < 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Las horas no pueden ser negativas' });
      return;
    }
    console.log('Guardando registro:', this.record);
    this.recordService.updateRecord(this.record).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado' });
        this.recordDialog = false;
        this.submitted = false;
        this.reloadCurrentPage();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar' });
      }
    });
  }

  hideDialog() {
    this.recordDialog = false;
    this.submitted = false;
    this.cdr.markForCheck();
  }

  editRecord(r: RecordValidarDTO) {
    this.record = {
      ...r,
      id_tarea: { ...r.id_tarea },
      id_trabajador: { ...r.id_trabajador }
    };
    this.selectedProjectId = this.record.id_tarea?.id_proyecto || null;
    this.selectedTaskId = this.record.id_tarea?.id || null;

    if (this.selectedProjectId) {
      this.loadTasksForProject(this.selectedProjectId);
    } else {
      this.tasks = [];
      this.syncRecordTaskSelection();
    }

    this.recordDialog = true;
    this.cdr.markForCheck();
  }
}
