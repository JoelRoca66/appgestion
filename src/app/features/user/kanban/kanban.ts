import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskDTO, TaskState } from '../../../core/models/task.model';

type ColumnKey = 'pendientes' | 'progreso' | 'bloqueadas' | 'revision' | 'completadas';

interface Column {
  key: ColumnKey;
  label: string;
  estado: TaskState;
  tareas: WritableSignal<TaskDTO[]>;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, DragDropModule, CardModule],
  templateUrl: './kanban.html',
  styleUrls: ['./kanban.css']
})
export class KanbanComponent implements OnInit {

  pendientes  = signal<TaskDTO[]>([]);
  progreso    = signal<TaskDTO[]>([]);
  bloqueadas  = signal<TaskDTO[]>([]);
  revision    = signal<TaskDTO[]>([]);
  completadas = signal<TaskDTO[]>([]);

  columns: Column[] = [
    { key: 'pendientes',  label: 'Pendientes', estado: 'PENDIENTE',   tareas: this.pendientes  },
    { key: 'progreso',    label: 'En Proceso',  estado: 'EN_PROCESO', tareas: this.progreso    },
    { key: 'bloqueadas',  label: 'Bloqueadas',  estado: 'BLOQUEADA',   tareas: this.bloqueadas  },
    { key: 'revision',    label: 'Revisión',    estado: 'REVISION',    tareas: this.revision    },
    { key: 'completadas', label: 'Completadas', estado: 'COMPLETADA',  tareas: this.completadas },
  ];

  // IDs de las columnas para conectarlas entre sí
  columnIds = this.columns.map(c => c.key);

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.cargarTareas();
  }

  cargarTareas() {
    this.taskService.getTasks(0, 200).subscribe(res => {
      const tareas = res.content;
      this.pendientes.set(  tareas.filter(t => t.estado === 'PENDIENTE')   );
      this.progreso.set(    tareas.filter(t => t.estado === 'EN_PROCESO') );
      this.bloqueadas.set(  tareas.filter(t => t.estado === 'BLOQUEADA')   );
      this.revision.set(    tareas.filter(t => t.estado === 'REVISION')    );
      this.completadas.set( tareas.filter(t => t.estado === 'COMPLETADA')  );
    });
  }

  onDrop(event: CdkDragDrop<TaskDTO[]>, destinoColumn: Column) {
    if (event.previousContainer === event.container) {
      // Reordenar dentro de la misma columna
      const arr = [...destinoColumn.tareas()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      destinoColumn.tareas.set(arr);
      return;
    }

    // Encontrar la columna origen
    const origenColumn = this.columns.find(c => c.key === event.previousContainer.id)!;

    const tarea = event.item.data as TaskDTO;
    const tareaActualizada: TaskDTO = { ...tarea, estado: destinoColumn.estado };

    // Actualizar signals
    origenColumn.tareas.set(origenColumn.tareas().filter(t => t.id !== tarea.id));
    destinoColumn.tareas.set([...destinoColumn.tareas(), tareaActualizada]);

    // Llamar al backend
    this.taskService.updateTask(this.convertirDTOaTask(tareaActualizada)).subscribe({
      error: (err) => {
        // Rollback
        destinoColumn.tareas.set(destinoColumn.tareas().filter(t => t.id !== tarea.id));
        origenColumn.tareas.set([...origenColumn.tareas(), tarea]);
        console.error('Error actualizando tarea', err);
      }
    });
  }

  private convertirDTOaTask(dto: TaskDTO): Task {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: dto.tipo,
      estado: dto.estado,
      observaciones: dto.observaciones,
      horas_estimadas: dto.horas_estimadas,
      fecha_ini: dto.fecha_ini,
      fecha_fin: dto.fecha_fin,
      tarea_padre: dto.tarea_padre,
      proyecto: dto.id_proyecto,
      subtareas: []
    };
  }
}