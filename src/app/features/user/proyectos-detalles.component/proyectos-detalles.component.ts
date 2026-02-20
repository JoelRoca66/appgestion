import { ChangeDetectorRef, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ProyectoTareasDTO, TareaLazyDTO } from '../../../core/models/project.model';
import { Task, TaskDTO, TaskState } from '../../../core/models/task.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ButtonModule } from "primeng/button";
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from "primeng/table";

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
    FormsModule,
    CardModule,
    TreeModule,
    TagModule,
    BadgeModule,
    DragDropModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    TableModule
  ],
  templateUrl: './proyectos-detalles.component.html',
  styleUrls: ['./proyectos-detalles.component.css']
})
export class ProyectosDetallesComponent implements OnInit {
  proyecto: ProyectoTareasDTO | null = null;
  taskTree: TreeNode[] = [];
  private loadingNodes = new Set<string>();
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  precioTotalMateriales: number = 0;
  precioBeneficio: number = 0;
  precioTotalProyecto: number = 0;

  // ── Kanban ──────────────────────────────────────────
  kanbanColumns: KanbanColumn[] = [
    { key: 'pendientes', label: 'Pendientes', estado: 'PENDIENTE', headerClass: 'header-pendiente', tareas: signal([]) },
    { key: 'progreso', label: 'En Proceso', estado: 'EN_PROCESO', headerClass: 'header-progreso', tareas: signal([]) },
    { key: 'bloqueadas', label: 'Bloqueadas', estado: 'BLOQUEADA', headerClass: 'header-bloqueada', tareas: signal([]) },
    { key: 'revision', label: 'Revisión', estado: 'REVISION', headerClass: 'header-revision', tareas: signal([]) },
    { key: 'completadas', label: 'Completadas', estado: 'COMPLETADA', headerClass: 'header-completada', tareas: signal([]) },
  ];

  kanbanColumnIds = this.kanbanColumns.map(c => c.key);
  isAdmin = false;

  materialesProyecto: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
  ) { }

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.detectAdminFromStorage();
    this.loadProject(projectId);
    this.loadMaterialesProyecto(projectId);
  }

  private detectAdminFromStorage() {
    try {
      const raw = sessionStorage.getItem('currentUser') ?? localStorage.getItem('currentUser');
      if (!raw) {
        this.isAdmin = false;
        return;
      }
      const obj = JSON.parse(raw);
      this.isAdmin = !!obj?.rol;
    } catch (e) {
      console.warn('No se pudo parsear currentUser desde storage', e);
      this.isAdmin = false;
    }
  }

  loadProject(id: number) {
    this.projectService.findById(id).subscribe({
      next: (res) => {
        this.proyecto = res;
        const tareas = (res.tareas_principales || []).sort((a, b) => a.id - b.id);

        // Tree
        this.taskTree = tareas.map(t => this.mapTaskToTreeNode(t));

        // Kanban — distribuir tareas por estado
        this.distribuirTareasKanban(tareas);

        this.actualizarTotalesProyecto();

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


  private mapTaskToTreeNode(task: TareaLazyDTO): TreeNode {
    const subtaskCount = (task as any)?.num_subtareas;
    const hasSubtaskCount = typeof subtaskCount === 'number';
    const hasKnownChildren = Array.isArray(task.subtareas);
    const mayHaveChildren = task.subtareas === null;
    let children: TreeNode[] = [];
    let isLeaf = true;

    if (hasKnownChildren) {
      children = (task.subtareas as TareaLazyDTO[]).map(t => this.mapTaskToTreeNode(t));
      isLeaf = children.length === 0;
    } else if (hasSubtaskCount) {
      children = [];
      isLeaf = subtaskCount === 0;
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
    const map: Record<string, any> = { COMPLETADO: 'success', COMPLETADA: 'success', EN_PROCESO: 'info', PENDIENTE: 'warn', CANCELADO: 'danger', CANCELADA: 'danger', BLOQUEADO: 'danger', BLOQUEADA: 'danger' };
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

  // ===== Dialog / Form para crear tarea =====
  taskDialog = false;
  task: any = this.getEmptyTask();
  submitted = false;
  dialogTitle = '';

  parentCandidates: any[] = [];
  loadingParents = false;

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

  getEmptyTask() {
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
      tarea_padre: undefined,
      id_proyecto: { id: 0, nombre: '' }
    };
  }

  openNew() {
    this.task = this.getEmptyTask();
    this.dialogTitle = 'Nueva Tarea';
    if (this.proyecto && this.proyecto.id) {
      this.task.id_proyecto = { id: this.proyecto.id, nombre: this.proyecto.nombre };
      this.loadParentsForProject(this.proyecto.id);
    }
    this.submitted = false;
    this.taskDialog = true;
    this.cdr.markForCheck();
  }

  loadParentsForProject(projectId: number) {
    this.loadingParents = true;
    this.taskService.getAllTaskNamesFromProject(projectId).subscribe({
      next: (res) => {
        this.parentCandidates = res.filter((t: any) => t.id !== this.task.id);
        this.loadingParents = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.parentCandidates = [];
        this.loadingParents = false;
      }
    });
  }

  onProjectChange() {
    const pid = this.task.id_proyecto?.id;
    if (pid) this.loadParentsForProject(pid);
  }

  hideDialog() {
    this.taskDialog = false;
    this.submitted = false;
  }

  saveTask() {
    this.submitted = true;
    if (!this.task.nombre || !this.task.id_proyecto?.id) return;

    const payload: any = {
      nombre: this.task.nombre,
      descripcion: this.task.descripcion,
      tipo: this.task.tipo,
      estado: this.task.estado,
      observaciones: this.task.observaciones,
      horas_estimadas: this.task.horas_estimadas,
      fecha_ini: this.task.fecha_ini,
      fecha_fin: this.task.fecha_fin,
      tarea_padre: this.task.tarea_padre ? { id: this.task.tarea_padre.id } : null,
      proyecto: { id: this.task.id_proyecto?.id }
    };

    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        this.hideDialog();
        if (this.proyecto && this.proyecto.id) this.loadProject(this.proyecto.id);
      },
      error: (err) => {
        console.error('Error creando tarea:', err);
      }
    });
  }

  verDetalleTarea(tarea: TareaLazyDTO) {
    this.router.navigate(['/user/tareas', tarea.id]);
  }

  loadMaterialesProyecto(projectId: number) {
    this.projectService.getMaterialesProyecto(projectId).subscribe({
      next: (res) => {
        this.materialesProyecto = res;
        this.actualizarTotalesProyecto();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando materiales del proyecto:', err);
        this.materialesProyecto = [];
        this.actualizarTotalesProyecto();
      }
    });
  }

  private actualizarTotalesProyecto(): void {
    this.precioTotalMateriales = this.materialesProyecto.reduce(
      (acc, m) => acc + (Number(m?.precioTotal) || 0),
      0
    );

    const margen = this.proyecto?.margen_beneficio ?? 0;
    this.precioBeneficio = (margen / 100) * this.precioTotalMateriales;
    this.precioTotalProyecto = this.precioTotalMateriales + this.precioBeneficio;
  }

  calcularPrecioBeneficio(): number {
    return this.precioBeneficio;
  }

  calcularPrecioTotalProyecto(): number {
    return this.precioTotalProyecto;
  }

  descargarInforme() {
    const projectId = this.proyecto?.id;
    if (!projectId) return;

    this.projectService.descargarInformeProyecto(projectId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;

        const contentDisposition = response.headers.get('content-disposition') ?? '';
        const fileName = this.extraerNombreArchivo(contentDisposition) ?? `informe-proyecto-${projectId}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando informe:', err);
      }
    });
  }

  private extraerNombreArchivo(contentDisposition: string): string | null {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

    const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (normalMatch?.[1]) return normalMatch[1];

    return null;
  }
}