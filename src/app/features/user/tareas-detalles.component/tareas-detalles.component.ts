import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TareaLazyDTO } from '../../../core/models/project.model';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeModule } from 'primeng/tree'
import { TreeNode } from 'primeng/api';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  standalone: true,
  selector: 'app-tareas-detalles',
  imports: [
    CommonModule,
    CardModule,
    TreeModule,
    TagModule
  ],
  templateUrl: './tareas-detalles.component.html',
  styleUrls: ['./tareas-detalles.component.css']
})
export class TareasDetallesComponent implements OnInit {

  tarea: TareaLazyDTO | null = null;
  taskTree: TreeNode[] = [];
  private loadingNodes = new Set<string>(); // Para trackear nodos en carga

  private cdr = inject(ChangeDetectorRef);
  projectName: string = '';
  tareaPadreName: string = '';
  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private proyectService: ProjectService
  ) { }

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

  ngOnInit(): void {
    const taskId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTask(taskId);
  }

  loadTask(id: number) {
    this.taskService.findById(id).subscribe({
      next: (res) => {
        this.tarea = res;


        if (res.id_proyecto) {
          this.proyectService.findById(res.id_proyecto).subscribe(p => {
            this.projectName = p.nombre;
            this.cdr.markForCheck();
          });
        }
        console.log('Tarea cargada:', res);
        if (res.tarea_padre) {
          this.taskService.getNameById(res.tarea_padre).subscribe(name => {
            this.tareaPadreName = name;
            this.cdr.markForCheck();
          });
        }

        this.taskTree = (res.subtareas || []).map(t =>
          this.mapTaskToTreeNode(t)
        );
        this.cdr.markForCheck();
      }
    });
  }

  onNodeExpand(event: any) {
    const node = event.node as TreeNode;
    const task = node.data as TareaLazyDTO;
    const nodeKey = node.key as string;

    if (this.loadingNodes.has(nodeKey)) {
      return;
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const hasRealChildren = node.children.some(child => child.data);
      if (hasRealChildren) {
        return;
      }
    }

    this.loadingNodes.add(nodeKey);

    node.children = [{
      key: `loading-${nodeKey}`,
      label: 'Cargando subtareas...',

      selectable: false,
      styleClass: 'text-color-secondary loading-node', // Agregar clase custom
      leaf: true,
      data: null // Asegurar que no tenga data
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
      const clonedNode: TreeNode = {
        ...node,
        data: { ...node.data }
      };

      if (node.children) {
        clonedNode.children = this.deepCloneTree(node.children);
      }

      return clonedNode;
    });
  }
  getEstadoSeverity(estado: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    if (!estado) return 'secondary';
    const severityMap: { [key: string]: "success" | "secondary" | "info" | "warn" | "danger" | "contrast" } = {
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

}