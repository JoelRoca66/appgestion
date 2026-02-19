import { ChangeDetectorRef, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TareaLazyDTO } from '../../../core/models/project.model';
import { Task, TaskDTO, TaskState } from '../../../core/models/task.model'; // ⬅️ importa Task y TaskState
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeModule } from 'primeng/tree';
import { BadgeModule } from 'primeng/badge';                  // ⬅️ badge para contador
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';


import { MessageService, TreeNode } from 'primeng/api';
import { SelectModule } from "primeng/select";
import { AuthService } from '../../../core/services/auth.service';
import { RecordService } from '../../../core/services/record.service';
import { JornadaDTO } from '../../../core/models/record.model';
import { finalize } from 'rxjs/operators';

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
  selector: 'app-tareas-detalles',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TreeModule,
    TagModule,
    BadgeModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule,
    DragDropModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    SelectModule,
  ],
  providers: [MessageService],

  templateUrl: './tareas-detalles.component.html',
  styleUrls: ['./tareas-detalles.component.css']
})
export class TareasDetallesComponent implements OnInit {

  tarea: TareaLazyDTO | null = null;
  taskTree: TreeNode[] = [];
  private loadingNodes = new Set<string>();

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // ── Kanban (subtareas directas de esta tarea) ─────────────
  kanbanColumns: KanbanColumn[] = [
    { key: 'pendientes', label: 'Pendientes', estado: 'PENDIENTE', headerClass: 'header-pendiente', tareas: signal([]) },
    { key: 'progreso', label: 'En Proceso', estado: 'EN_PROCESO', headerClass: 'header-progreso', tareas: signal([]) },
    { key: 'bloqueadas', label: 'Bloqueadas', estado: 'BLOQUEADA', headerClass: 'header-bloqueada', tareas: signal([]) },
    { key: 'revision', label: 'Revisión', estado: 'REVISION', headerClass: 'header-revision', tareas: signal([]) },
    { key: 'completadas', label: 'Completadas', estado: 'COMPLETADA', headerClass: 'header-completada', tareas: signal([]) },
  ];
  kanbanColumnIds = this.kanbanColumns.map(c => c.key);

  projectName: string = '';
  tareaPadreName: string = '';
  isAdmin = false;

  // Diálogo de jornada
  jornadaDialog = false;
  jornadaFecha: Date | null = new Date();
  jornadaHoras: number | null = null;
  selectedTask: TareaLazyDTO | TaskDTO | null = null;
  savingJornada = false;


  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private proyectService: TaskService,
    private auth: AuthService,
    private jornadaService: RecordService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.detectAdminFromStorage();

    this.route.paramMap.subscribe(params => {
      const taskId = Number(params.get('id'));
      if (!isNaN(taskId)) {
        this.loadTask(taskId);
      }
    });
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

  loadTask(id: number) {
    this.taskService.findById(id).subscribe({
      next: (res) => {
        this.tarea = res;

        // Tree (subtareas directas)
        this.taskTree = (res.subtareas || []).map(t => this.mapTaskToTreeNode(t));

        // Kanban — distribuir subtareas por estado
        this.distribuirTareasKanban(res.subtareas || []);

        this.cdr.markForCheck();

        if (res.id_proyecto) {
          this.proyectService.findById(res.id_proyecto).subscribe(p => {
            this.projectName = p.nombre;
            this.cdr.markForCheck();
          });
        }
        if (res.tarea_padre) {
          this.taskService.getNameById(res.tarea_padre).subscribe(name => {
            this.tareaPadreName = name;
            this.cdr.markForCheck();
          });
        }
      }
    });
  }

  // ── Kanban logic ────────────────────────────────────

  /** Distribuye las subtareas directas de la tarea en las columnas según su estado */
  private distribuirTareasKanban(subtareas: TareaLazyDTO[]) {
    for (const col of this.kanbanColumns) {
      col.tareas.set(subtareas.filter(t => (t.estado as TaskState) === col.estado));
    }
  }

  /** Drag & Drop: reordenación o cambio de columna con actualización optimista + rollback */
  onKanbanDrop(event: CdkDragDrop<TareaLazyDTO[]>, destinoCol: KanbanColumn) {
    // Reordenación dentro de la misma columna
    if (event.previousContainer === event.container) {
      const arr = [...destinoCol.tareas()];
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      destinoCol.tareas.set(arr);
      return;
    }

    // Cambio de columna
    const origenCol = this.kanbanColumns.find(c => c.key === (event.previousContainer.id as KanbanColumnKey))!;
    const tarea = event.item.data as TareaLazyDTO;

    const tareaActualizada: TareaLazyDTO = { ...tarea, estado: destinoCol.estado };

    // ✅ Optimistic update (Kanban)
    origenCol.tareas.set(origenCol.tareas().filter(t => t.id !== tarea.id));
    destinoCol.tareas.set([...destinoCol.tareas(), tareaActualizada]);

    // ✅ Sincroniza también el árbol
    this.actualizarEstadoEnTree(tarea.id, destinoCol.estado);

    // 🔄 Persistir en backend
    this.taskService.updateTask(this.convertirLazyDTOaTask(tareaActualizada)).subscribe({
      error: (err) => {
        console.error('Error actualizando tarea:', err);
        // ⛔ Rollback Kanban
        destinoCol.tareas.set(destinoCol.tareas().filter(t => t.id !== tarea.id));
        origenCol.tareas.set([...origenCol.tareas(), tarea]);
        // ⛔ Rollback Tree
        this.actualizarEstadoEnTree(tarea.id, origenCol.estado);
      }
    });
  }

  /** Refleja el cambio de estado en el árbol de subtareas (nodo existente) */
  private actualizarEstadoEnTree(tareaId: number, nuevoEstado: TaskState) {
    this.taskTree = this.actualizarEstadoEnNodos(this.taskTree, tareaId, nuevoEstado);
    this.cdr.detectChanges();
  }
  private actualizarEstadoEnNodos(nodos: TreeNode[], tareaId: number, nuevoEstado: TaskState): TreeNode[] {
    return nodos.map(nodo => {
      if (nodo.data?.id === tareaId) {
        return { ...nodo, data: { ...nodo.data, estado: nuevoEstado } };
      }
      if (nodo.children?.length) {
        return { ...nodo, children: this.actualizarEstadoEnNodos(nodo.children, tareaId, nuevoEstado) };
      }
      return nodo;
    });
  }

  getTotalTareasKanban(): number {
    return this.kanbanColumns.reduce((acc, col) => acc + col.tareas().length, 0);
  }

  /** Convierte el LazyDTO a tu modelo Task que usa el servicio updateTask */
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

  // ── Tree ya lo tenías ──────────────────────────────

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

    return {
      key: task.id.toString(),
      label: task.nombre,
      data: task,
      icon: 'pi pi-list',
      children: children,
      leaf: isLeaf
    }
  }

  onNodeExpand(event: any) {
    const node = event.node as TreeNode;
    const task = node.data as TareaLazyDTO;
    const nodeKey = node.key as string;

    if (this.loadingNodes.has(nodeKey)) return;
    if (Array.isArray(node.children) && node.children.some(c => c.data)) return;

    this.loadingNodes.add(nodeKey);

    node.children = [{
      key: `loading-${nodeKey}`,
      label: 'Cargando subtareas...',
      selectable: false,
      styleClass: 'text-color-secondary loading-node',
      leaf: true,
      data: null
    }];

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
        node.children = [{
          key: `error-${nodeKey}`,
          label: 'Error al cargar subtareas',
          styleClass: 'text-red-500 error-node',
          selectable: false,
          leaf: true,
          data: null
        }];
        node.leaf = false;
        this.loadingNodes.delete(nodeKey);
        this.taskTree = this.deepCloneTree(this.taskTree);
        this.cdr.detectChanges();
      }
    });
  }

  private deepCloneTree(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      const clonedNode: TreeNode = { ...node, data: { ...node.data } };
      if (node.children) clonedNode.children = this.deepCloneTree(node.children);
      return clonedNode;
    });
  }

  // (Mantén tus helpers de estado/iconos)
  getEstadoSeverity(estado: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    if (!estado) return 'secondary';
    const severityMap: { [key: string]: any } = {
      'COMPLETADO': 'success',
      'COMPLETADA': 'success',
      'EN_PROCESO': 'info',
      'EN PROCESO': 'info',
      'PENDIENTE': 'warn',
      'CANCELADO': 'danger',
      'CANCELADA': 'danger',
      'BLOQUEADO': 'danger',
      'BLOQUEADA': 'danger'
    };
    return severityMap[estado?.toUpperCase()] || 'secondary';
  }

  getTareaIcon(tipo: string): string {
    const iconMap: Record<string, string> = {
      'DESARROLLO': 'code',
      'TECNICA': 'cog',
      'DISEÑO': 'palette',
      'BUG': 'bug',
      'TESTING': 'check-circle',
      'DOCUMENTACION': 'file-edit'
    };
    return iconMap[tipo] || 'circle';
  }

  getTareaIconColor(tipo: string): string {
    const colorMap: Record<string, string> = {
      'DESARROLLO': 'text-blue-500',
      'TECNICA': 'text-purple-500',
      'DISEÑO': 'text-pink-500',
      'BUG': 'text-red-500',
      'TESTING': 'text-green-500',
      'DOCUMENTACION': 'text-orange-500'
    };
    return colorMap[tipo] || 'text-gray-500';
  }

  getTotalTareas(): number {
    return this.taskTree.length;
  }

  // ===== Dialog / Form para crear/editar tarea (subtarea) =====
  taskDialog = false;
  task: any = this.getEmptyTask();
  submitted = false;
  dialogTitle = '';

  parentCandidates: any[] = [];
  projects: any[] = [];
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

  /** Abre diálogo para crear una nueva subtarea y preselecciona la tarea actual como padre */
  openNewSubtask() {
    this.task = this.getEmptyTask();
    this.dialogTitle = 'Nueva Subtarea';
    // Si hay una tarea cargada, preseleccionarla como padre
    if (this.tarea && this.tarea.id) {
      this.task.tarea_padre = { id: this.tarea.id, nombre: this.tarea.nombre };
      // Preseleccionar proyecto también si está disponible
      if (this.tarea.id_proyecto) {
        this.task.id_proyecto = { id: this.tarea.id_proyecto, nombre: this.projectName };
      }
      // Cargar candidatos de padres del mismo proyecto
      const projId = this.task.id_proyecto?.id || this.tarea.id_proyecto || null;
      if (projId) this.loadParentsForProject(projId);
    }

    this.submitted = false;
    this.taskDialog = true;
    this.cdr.markForCheck();
  }

  loadParentsForProject(projectId: number) {
    this.loadingParents = true;
    this.taskService.getAllTaskNamesFromProject(projectId).subscribe({
      next: (res) => {
        // Excluir la propia tarea actual (si aplica)
        this.parentCandidates = res.filter((t: any) => t.id !== this.task.id && t.id !== this.tarea?.id);
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
      tarea_padre: this.task.tarea_padre ? { id: this.task.tarea_padre.id } : (this.tarea ? { id: this.tarea.id } : null),
      proyecto: { id: this.task.id_proyecto?.id ?? this.tarea?.id_proyecto }
    };
    this.taskService.createTask(payload).subscribe({
      next: (res) => {
        this.hideDialog();
        // Recargar la tarea actual para reflejar nueva subtarea
        if (this.tarea && this.tarea.id) this.loadTask(this.tarea.id);
      },
      error: (err) => {
        console.error('Error creando tarea:', err);
      }
    });
  }

  // Compatibilidad con plantilla existente que llama a openNew()
  openNew() {
    this.openNewSubtask();
  }


  openJornadaDialog(tarea: TareaLazyDTO | TaskDTO | null) {
    if (!tarea) return;
    this.selectedTask = tarea;
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


  verDetalleTarea(key: number) {
    console.log('Navegando a detalle de tarea con id:', key);
    this.router.navigate(['/user/tareas', key]);
  }

}
