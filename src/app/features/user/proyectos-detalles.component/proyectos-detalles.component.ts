import { ChangeDetectorRef, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ProyectoTareasDTO, TareaLazyDTO } from '../../../core/models/project.model';
import { Task, TaskDTO, TaskState } from '../../../core/models/task.model';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

type KanbanColumnKey = 'pendientes' | 'progreso' | 'bloqueadas' | 'revision' | 'completadas';

interface KanbanColumn {
  key: KanbanColumnKey;
  label: string;
  estado: TaskState;
  headerClass: string;
  tareas: WritableSignal<TareaLazyDTO[]>;
}

@Component({
  standalone: true,
  selector: 'app-proyectos-detalles',
  imports: [
    CommonModule,
    CardModule,
    TreeModule,
    TagModule,
    BadgeModule,
    DragDropModule,
  ],
  templateUrl: './proyectos-detalles.component.html',
  styleUrls: ['./proyectos-detalles.component.css']
})
export class ProyectosDetallesComponent implements OnInit {

  proyecto: ProyectoTareasDTO | null = null;
  taskTree: TreeNode[] = [];
  private loadingNodes = new Set<string>();
  private cdr = inject(ChangeDetectorRef);

  // ── Kanban ──────────────────────────────────────────
  kanbanColumns: KanbanColumn[] = [
    { key: 'pendientes', label: 'Pendientes', estado: 'PENDIENTE', headerClass: 'header-pendiente', tareas: signal([]) },
    { key: 'progreso', label: 'En Proceso', estado: 'EN_PROCESO', headerClass: 'header-progreso', tareas: signal([]) },
    { key: 'bloqueadas', label: 'Bloqueadas', estado: 'BLOQUEADA', headerClass: 'header-bloqueada', tareas: signal([]) },
    { key: 'revision', label: 'Revisión', estado: 'REVISION', headerClass: 'header-revision', tareas: signal([]) },
    { key: 'completadas', label: 'Completadas', estado: 'COMPLETADA', headerClass: 'header-completada', tareas: signal([]) },
  ];

  kanbanColumnIds = this.kanbanColumns.map(c => c.key);

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
  ) { }

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(projectId);
  }

  loadProject(id: number) {
    this.projectService.findById(id).subscribe({
      next: (res) => {
        this.proyecto = res;
        const tareas = res.tareas_principales || [];

        // Tree
        this.taskTree = tareas.map(t => this.mapTaskToTreeNode(t));

        // Kanban — distribuir tareas por estado
        this.distribuirTareasKanban(tareas);

        this.cdr.markForCheck();
      }
    });
  }

  // ── Kanban logic ────────────────────────────────────

  private distribuirTareasKanban(tareas: TareaLazyDTO[]) {
    for (const col of this.kanbanColumns) {
      col.tareas.set(tareas.filter(t => t.estado === col.estado));
    }
  }

  onKanbanDrop(event: CdkDragDrop<TareaLazyDTO[]>, destinoCol: KanbanColumn) {
    if (event.previousContainer === event.container) {
      const arr = [...destinoCol.tareas()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      destinoCol.tareas.set(arr);
      return;
    }

    const origenCol = this.kanbanColumns.find(c => c.key === event.previousContainer.id)!;
    const tarea = event.item.data as TareaLazyDTO;
    const tareaActualizada = { ...tarea, estado: destinoCol.estado };

    // Optimistic update en Kanban
    origenCol.tareas.set(origenCol.tareas().filter(t => t.id !== tarea.id));
    destinoCol.tareas.set([...destinoCol.tareas(), tareaActualizada]);

    // ✅ Sincronizar el Tree
    this.actualizarEstadoEnTree(tarea.id, destinoCol.estado);

    this.taskService.updateTask(this.convertirLazyDTOaTask(tareaActualizada)).subscribe({
      error: (err) => {
        // Rollback en Kanban
        destinoCol.tareas.set(destinoCol.tareas().filter(t => t.id !== tarea.id));
        origenCol.tareas.set([...origenCol.tareas(), tarea]);
        // ✅ Rollback en Tree
        this.actualizarEstadoEnTree(tarea.id, origenCol.estado);
        console.error('Error actualizando tarea:', err);
      }
    });
  }
  private actualizarEstadoEnTree(tareaId: number, nuevoEstado: TaskState) {
    this.taskTree = this.actualizarEstadoEnNodos(this.taskTree, tareaId, nuevoEstado);
    this.cdr.detectChanges();
  }

  private actualizarEstadoEnNodos(nodos: TreeNode[], tareaId: number, nuevoEstado: TaskState): TreeNode[] {
    return nodos.map(nodo => {
      if (nodo.data?.id === tareaId) {
        // Clonar el nodo con el nuevo estado
        return {
          ...nodo,
          data: { ...nodo.data, estado: nuevoEstado }
        };
      }
      // Buscar recursivamente en hijos
      if (nodo.children?.length) {
        return {
          ...nodo,
          children: this.actualizarEstadoEnNodos(nodo.children, tareaId, nuevoEstado)
        };
      }
      return nodo;
    });
  }
  getTotalTareasKanban(): number {
    return this.kanbanColumns.reduce((acc, col) => acc + col.tareas().length, 0);
  }

  private convertirLazyDTOaTask(dto: TareaLazyDTO): Task {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: dto.tipo,
      estado: dto.estado as TaskState,
      observaciones: (dto as any).observaciones ?? '',
      horas_estimadas: dto.horas_estimadas,
      fecha_ini: (dto as any).fecha_ini ?? '',
      fecha_fin: (dto as any).fecha_fin ?? '',
      tarea_padre: (dto as any).tarea_padre ?? null,
      proyecto: dto.id_proyecto as any,
      subtareas: []
    };
  }

  // ── Tree logic (sin cambios) ─────────────────────────

  private mapTaskToTreeNode(task: TareaLazyDTO): TreeNode {
    const hasKnownChildren = Array.isArray(task.subtareas);
    const mayHaveChildren = task.subtareas === null;
    let children: TreeNode[] = [];
    let isLeaf = true;

    if (hasKnownChildren) {
      children = (task.subtareas as TareaLazyDTO[]).map(t => this.mapTaskToTreeNode(t));
      isLeaf = children.length === 0;
    } else if (mayHaveChildren) {
      children = [];
      isLeaf = false;
    }

    return { key: task.id.toString(), label: task.nombre, data: task, icon: 'pi pi-list', children, leaf: isLeaf };
  }

  onNodeExpand(event: any) {
    const node = event.node as TreeNode;
    const task = node.data as TareaLazyDTO;
    const nodeKey = node.key as string;

    if (this.loadingNodes.has(nodeKey)) return;
    if (Array.isArray(node.children) && node.children.some(c => c.data)) return;

    this.loadingNodes.add(nodeKey);
    node.children = [{ key: `loading-${nodeKey}`, label: 'Cargando subtareas...', selectable: false, styleClass: 'loading-node', leaf: true, data: null }];
    this.cdr.detectChanges();

    this.taskService.findById(task.id).subscribe({
      next: (res) => {
        const sub = res.subtareas ?? [];
        node.children = sub.map(t => this.mapTaskToTreeNode(t));
        node.leaf = sub.length === 0;
        this.loadingNodes.delete(nodeKey);
        this.taskTree = this.deepCloneTree(this.taskTree);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando subtareas:', err);
        node.children = [{ key: `error-${nodeKey}`, label: 'Error al cargar subtareas', styleClass: 'error-node', selectable: false, leaf: true, data: null }];
        node.leaf = false;
        this.loadingNodes.delete(nodeKey);
        this.taskTree = this.deepCloneTree(this.taskTree);
        this.cdr.detectChanges();
      }
    });
  }

  private deepCloneTree(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => ({ ...node, data: { ...node.data }, children: node.children ? this.deepCloneTree(node.children) : undefined }));
  }

  getEstadoSeverity(estado: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    const map: Record<string, any> = { COMPLETADO: 'success', COMPLETADA: 'success', EN_PROGRESO: 'info', PENDIENTE: 'warn', CANCELADO: 'danger', CANCELADA: 'danger', BLOQUEADO: 'danger', BLOQUEADA: 'danger' };
    return map[estado?.toUpperCase()] || 'secondary';
  }

  getTareaIcon(tipo: string): string {
    const map: Record<string, string> = { DESARROLLO: 'code', TECNICA: 'cog', DISEÑO: 'palette', BUG: 'bug', TESTING: 'check-circle', DOCUMENTACION: 'file-edit' };
    return map[tipo] || 'circle';
  }

  getTareaIconColor(tipo: string): string {
    const map: Record<string, string> = { DESARROLLO: 'text-blue-500', TECNICA: 'text-purple-500', DISEÑO: 'text-pink-500', BUG: 'text-red-500', TESTING: 'text-green-500', DOCUMENTACION: 'text-orange-500' };
    return map[tipo] || 'text-gray-500';
  }

  getTotalTareas(): number { return this.taskTree.length; }
}