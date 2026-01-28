import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { StorageService } from '../../../core/services/storage.service';
import { WorkerService } from '../../../core/services/worker.service';
import { User } from '../../../core/models/user.model';
import { TareaJornadaDTO } from '../../../core/models/task.model';

interface TaskUI {
  id: number;
  titulo: string;
  proyecto: string;
  estado: string;
  prioridad: string;
  fecha_limite: Date | null;
  progreso: number;
  horas: number;
  horas_estimadas: number;
}

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    AvatarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class UserHomeComponent implements OnInit {

  currentUser: User | null = null;
  misTareas: TaskUI[] = [];
  loading: boolean = true;

  constructor(
    private storage: StorageService,
    private workerService: WorkerService,
    private messageService: MessageService
  ) { }
  private cdr = inject(ChangeDetectorRef);


  ngOnInit() {
    this.loadCurrentUser();
    if (this.currentUser?.id_trabajador) {
      this.loadTareas();
    } else {
      this.loading = false;

    }
  }

  loadCurrentUser() {
    try {
      const data = this.storage.getItem('currentUser');
      if (data) this.currentUser = JSON.parse(data);
    } catch (e) {
      console.error('Error cargando usuario', e);
    }
  }

  loadTareas() {
    this.workerService.getTareasTrabajador(
      this.currentUser!.id_trabajador,
      0,
      20
    ).subscribe({
      next: (resp) => {
        this.misTareas = resp.content.map(t => this.toTaskUI(t));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las tareas'
        });
        this.loading = false;
      }
    });
  }

  toTaskUI(tarea: TareaJornadaDTO): TaskUI {
    const progreso = tarea.horas_estimadas > 0
      ? Math.min(100, (tarea.horas / tarea.horas_estimadas) * 100)
      : 0;

    return {
      id: tarea.id,
      titulo: tarea.nombre || 'Sin nombre',
      proyecto: tarea.id_proyecto?.nombre || 'Sin proyecto',
      estado: tarea.estado || 'pendiente',
      prioridad: 'media',
      fecha_limite: tarea.fecha_fin
        ? new Date(tarea.fecha_fin)
        : null,
      progreso: Math.round(progreso),
      horas: tarea.horas,
      horas_estimadas: tarea.horas_estimadas
    };
  }

  getPriorityIcon(pr: string) {
    return pr === 'alta' ? 'pi pi-exclamation-circle' :
      pr === 'media' ? 'pi pi-info-circle' :
        'pi pi-minus-circle';
  }

  getPriorityClass(pr: string) {
    return pr === 'alta' ? 'priority-high' :
      pr === 'media' ? 'priority-medium' :
        'priority-low';
  }

  verDetalleTarea(tarea: TaskUI) {
    console.log("Detalle tarea:", tarea);
  }
}