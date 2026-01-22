import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, finalize, takeUntil } from 'rxjs/operators';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';

import { ConfirmationService, MessageService } from 'primeng/api';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskDTO, TaskListDTO } from '../../../core/models/task.model';
import { TaskFilter } from '../../../core/models/taskFilter.model';
import { Project, ProjectDTO } from '../../../core/models/project.model';

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

@Component({
  selector: 'app-maintenance-task',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    ConfirmDialogModule, ToastModule, InputTextModule, InputNumberModule,
    TextareaModule, ToolbarModule, SelectModule, PopoverModule, CheckboxModule,
    ChipModule, DatePickerModule, TagModule, DividerModule, BadgeModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './maintenance-task.html',
  styleUrl: './maintenance-task.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceTask implements OnInit {

  @ViewChild('dt') dt!: Table;

  tasks: TaskDTO[] = [];
  projects: ProjectDTO[] = [];
  parentCandidates: TaskListDTO[] = [];

  estados: any[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Bloqueada', value: 'BLOQUEADA' },
    { label: 'Revisión', value: 'REVISION' },
    { label: 'Completada', value: 'COMPLETADA' }
  ];

  tipos: any[] = [
    { label: 'Desarrollo', value: 'DESARROLLO' },
    { label: 'Bug', value: 'BUG' },
    { label: 'Documentación', value: 'DOCUMENTACION' },
    { label: 'Diseño', value: 'DISENO' }
  ];

  activeFilters: ActiveFilter[] = [];
  totalRecords = 0;
  loading = false;
  lastTableEvent: TableLazyLoadEvent | null = null;
  searchTerm = '';
  loadingParents = false;

  filterParentTasks: TaskListDTO[] = []; 
  loadingFilterParents = false;

  filterTipo: string | null = null;
  filterEstado: string | null = null;
  filterProyecto: ProjectDTO | null = null;
  filterPadre: TaskListDTO | null = null;
  filterFechaIniDesde: Date | null = null;
  filterFechaIniHasta: Date | null = null;
  filterFechaFinDesde: Date | null = null;
  filterFechaFinHasta: Date | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest: Subscription | null = null;

  taskDialog = false;
  task: TaskDTO = this.getEmptyTask();
  submitted = false;
  dialogTitle = '';

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(750),
      distinctUntilChanged(),
      filter(texto => texto.length >= 3 || texto.length === 0),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.dt.reset();
    });

    this.loadProjectsList();
  }

  loadProjectsList() {
    this.projectService.getAllProjectNames().subscribe(res => {
      this.projects = res;
      this.cdr.markForCheck();
    });
  }

  loadParentsForProject(projectId: number) {
    this.loadingParents = true;
    this.taskService.getAllTaskNamesFromProject(projectId).subscribe({
        next: (res) => {
            this.parentCandidates = res.filter(t => t.id !== this.task.id);
            this.loadingParents = false;
            this.cdr.markForCheck();
        },
        error: () => {
            this.parentCandidates = [];
            this.loadingParents = false;
        }
    });
  }

  getEmptyTask(): TaskDTO {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      tipo: 'DESARROLLO',
      estado: 'PENDIENTE',
      horas_estimadas: 0,
      fecha_ini: undefined,
      fecha_fin: undefined,
      observaciones: '',
      subtareas_ids: [],
      tarea_padre: undefined,
      id_proyecto: { id: 0, nombre: '', descripcion: '', estado: '', fecha_ini: new Date(), fecha_fin: new Date(), margen_beneficio: 0, totalTareas: 0, tareasCompletadas: 0 }
    };
  }

  get filteredParentCandidates(): TaskListDTO[] {
    if (this.task && this.task.id) {
      return this.parentCandidates.filter(p => p.id !== this.task.id);
    }
    return this.parentCandidates;
  }

  private parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;
    let date: Date;
    if (Array.isArray(dateValue)) {
      date = new Date(dateValue[0], (dateValue[1] || 1) - 1, dateValue[2] || 1, dateValue[3] || 0, dateValue[4] || 0, dateValue[5] || 0);
    } else {
      date = new Date(dateValue);
    }
    return isNaN(date.getTime()) ? undefined : date;
  }

  loadTasks(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    this.loading = true;
    this.cdr.markForCheck();

    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
      this.currentRequest = null;
    }

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    const hasFilters = this.searchTerm ||
      this.filterTipo ||
      this.filterEstado ||
      this.filterProyecto ||
      this.filterPadre ||
      this.filterFechaIniDesde ||
      this.filterFechaIniHasta ||
      this.filterFechaFinDesde ||
      this.filterFechaFinHasta;

    const filterParams: TaskFilter = {
      term: this.searchTerm,
      tipo: this.filterTipo ?? undefined,
      estado: this.filterEstado ?? undefined,
      proyecto: this.filterProyecto?.id ?? undefined,
      padre: this.filterPadre?.id ?? undefined,
      fecha_inicio_desde: this.filterFechaIniDesde ?? undefined,
      fecha_inicio_hasta: this.filterFechaIniHasta ?? undefined,
      fecha_fin_desde: this.filterFechaFinDesde ?? undefined,
      fecha_fin_hasta: this.filterFechaFinHasta ?? undefined
    };

    const request$ = hasFilters
      ? this.taskService.searchTask(filterParams, page, size)
      : this.taskService.getTasks(page, size);

    this.currentRequest = request$
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: response => {
          this.tasks = response.content.map(t => ({
            ...t,
            fecha_ini: this.parseDate(t.fecha_ini),
            fecha_fin: this.parseDate(t.fecha_fin)
          }));
          this.totalRecords = response.totalElements;
        },
        error: (err) => {
          console.error('Error cargando tareas', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilters() {
    const filters: ActiveFilter[] = [];

    if (this.filterTipo) {
        const label = this.tipos.find(t => t.value === this.filterTipo)?.label || this.filterTipo;
        filters.push({ key: 'tipo', label: `Tipo: ${label}`, value: this.filterTipo });
    }

    if (this.filterEstado) {
        const label = this.estados.find(e => e.value === this.filterEstado)?.label || this.filterEstado;
        filters.push({ key: 'estado', label: `Estado: ${label}`, value: this.filterEstado });
    }

    if (this.filterProyecto) {
        filters.push({ key: 'proyecto', label: `Proyecto: ${this.filterProyecto.nombre}`, value: this.filterProyecto });
    }

    if (this.filterPadre) {
        filters.push({ key: 'padre', label: `Padre: ${this.filterPadre.nombre}`, value: this.filterPadre });
    }

    if (this.filterFechaIniDesde) filters.push({ key: 'fIniD', label: `Ini > ${this.filterFechaIniDesde.toLocaleDateString()}`, value: this.filterFechaIniDesde });
    if (this.filterFechaIniHasta) filters.push({ key: 'fIniH', label: `Ini < ${this.filterFechaIniHasta.toLocaleDateString()}`, value: this.filterFechaIniHasta });
    if (this.filterFechaFinDesde) filters.push({ key: 'fFinD', label: `Fin > ${this.filterFechaFinDesde.toLocaleDateString()}`, value: this.filterFechaFinDesde });
    if (this.filterFechaFinHasta) filters.push({ key: 'fFinH', label: `Fin < ${this.filterFechaFinHasta.toLocaleDateString()}`, value: this.filterFechaFinHasta });

    this.activeFilters = filters;
    this.dt.reset(); 
}

  clearFilters() {
    this.searchTerm = '';
    this.filterTipo = null;
    this.filterEstado = null;
    this.filterProyecto = null;
    this.filterPadre = null;
    this.filterFechaIniDesde = null;
    this.filterFechaIniHasta = null;
    this.filterFechaFinDesde = null;
    this.filterFechaFinHasta = null;
    this.activeFilters = [];
    this.filterParentTasks = [];
    this.dt.reset();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  openNew() {
    this.task = this.getEmptyTask();
    this.parentCandidates = [];
    this.submitted = false;
    this.dialogTitle = 'Nueva Tarea';
    this.taskDialog = true;
  }

  editTask(t: TaskDTO) {
    this.task = {
      ...t,
      fecha_ini: this.parseDate(t.fecha_ini),
      fecha_fin: this.parseDate(t.fecha_fin),
      id_proyecto: t.id_proyecto,
      tarea_padre: t.tarea_padre
    };
    if (this.task.id_proyecto && this.task.id_proyecto.id) {
        this.loadParentsForProject(this.task.id_proyecto.id);
    } else {
        this.parentCandidates = [];
    }

    this.dialogTitle = 'Editar Tarea';
    this.taskDialog = true;
    this.cdr.markForCheck();
  }

  saveTask() {
    this.submitted = true;

    if (!this.task.nombre.trim() || !this.task.id_proyecto?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Completa los campos requeridos (Nombre y Proyecto).' });
      this.cdr.markForCheck();
      return;
    }

    const taskToSave: Task = {
      ...this.task,
      proyecto: this.task.id_proyecto
    };

    const request$ = this.task.id
      ? this.taskService.updateTask(taskToSave)
      : this.taskService.createTask(taskToSave);

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tarea guardada correctamente' });
        this.taskDialog = false;
        this.reloadCurrentPage();
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la tarea' });
        this.cdr.markForCheck();
      }
    });
  }

  deleteTask(t: Task) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la tarea "${t.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.taskService.deleteTask(t.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Tarea eliminada' });
            this.reloadCurrentPage();
            this.cdr.markForCheck();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la tarea' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  hideDialog() {
    this.taskDialog = false;
    this.submitted = false;
    this.cdr.markForCheck();
  }

  reloadCurrentPage() {
    if (this.lastTableEvent) {
      this.loadTasks(this.lastTableEvent);
    } else {
      this.dt.reset();
    }
  }

  getSeverity(estado: string) {
    switch (estado) {
      case 'COMPLETADA': return 'success';
      case 'EN_PROCESO': return 'info';
      case 'PENDIENTE': return 'warn';
      case 'BLOQUEADA': return 'danger';
      case 'REVISION': return 'secondary';
      default: return 'contrast';
    }
  }

  onProjectChange() {
    this.task.tarea_padre = undefined;
    
    if (this.task.id_proyecto && this.task.id_proyecto.id) {
        this.loadParentsForProject(this.task.id_proyecto.id);
    } else {
        this.parentCandidates = [];
    }
  }

  onFilterProjectChange() {
    this.filterPadre = null;
    
    if (this.filterProyecto && this.filterProyecto.id) {
        this.loadingFilterParents = true;
        this.taskService.getAllTaskNamesFromProject(this.filterProyecto.id).subscribe({
            next: (res) => {
                this.filterParentTasks = res;
                this.loadingFilterParents = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.filterParentTasks = [];
                this.loadingFilterParents = false;
                this.cdr.markForCheck();
            }
        });
    } else {
        this.filterParentTasks = [];
    }
  }
}