// features/users/user-tasks/user-tasks.component.ts
import {
  Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, finalize, takeUntil } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { TaskDTO, TaskListDTO } from '../../../core/models/task.model';
import { ProjectDTO } from '../../../core/models/project.model';
import { TaskFilter } from '../../../core/models/taskFilter.model';
import { JornadaDTO } from '../../../core/models/record.model';
import { RecordService } from '../../../core/services/record.service';
import { Route, Router, RouterModule } from '@angular/router';

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    ToastModule, InputNumberModule, DatePickerModule, SelectModule,
    PopoverModule, ChipModule, TagModule, DividerModule, BadgeModule,
    InputTextModule, IconFieldModule, InputIconModule, RouterModule
  ],
  providers: [MessageService],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TareasComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // Listado y filtros (idéntico a tu MaintenanceTask)
  tasks: TaskDTO[] = [];
  projects: ProjectDTO[] = [];
  filterParentTasks: TaskListDTO[] = [];

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

  // Diálogo de jornada
  jornadaDialog = false;
  jornadaFecha: Date | null = new Date();
  jornadaHoras: number | null = null;
  selectedTask: TaskDTO | null = null;
  savingJornada = false;

  constructor(
    private messageService: MessageService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private jornadaService: RecordService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private router: Router
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

    this.currentRequest?.unsubscribe();
    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    const hasFilters = this.searchTerm ||
      this.filterTipo || this.filterEstado ||
      this.filterProyecto || this.filterPadre ||
      this.filterFechaIniDesde || this.filterFechaIniHasta ||
      this.filterFechaFinDesde || this.filterFechaFinHasta;

    const filterParams: TaskFilter = {
      term: this.searchTerm,                    // 👈 asegúrate de usar 'term', no 'texto'
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
        error: err => {
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

  onFilterProjectChange() {
    this.filterPadre = null;
    if (this.filterProyecto?.id) {
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

  // ===== Jornadas =====

  openJornadaDialog(task: TaskDTO) {
    this.selectedTask = task;
    this.jornadaFecha = new Date();
    this.jornadaHoras = null;
    this.jornadaDialog = true;
    this.cdr.markForCheck();
  }

  saveJornada() {
    if (!this.selectedTask?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Tarea no seleccionada.' });
      return;
    }
    if (!this.jornadaFecha) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La fecha es obligatoria.' });
      return;
    }
    const horas = this.jornadaHoras ?? 0;
    if (horas <= 0 || horas > 12) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Horas inválidas (1–12).' });
      return;
    }

    const trabajadorId = this.auth.getCurrentWorkerId(); // ⚠️ toma el id real del usuario logado
    const body: JornadaDTO = {
      fecha: this.jornadaFecha.toISOString().slice(0, 10), // 'YYYY-MM-DD' para LocalDate
      horas,
      validado: false,
      id_tarea: this.selectedTask.id!,
      id_trabajador: trabajadorId
    };

    this.savingJornada = true;
    this.jornadaService.addJornada(body).pipe(
      finalize(() => {
        this.savingJornada = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Jornada registrada', detail: 'Se ha enviado para validación.' });
        this.jornadaDialog = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la jornada.' });
      }
    });
  }

  hideJornadaDialog() {
    this.jornadaDialog = false;
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

  goToTaskDetail(taskId: number) {
    this.router.navigate(['/user/tareas', taskId]);
  }
}
