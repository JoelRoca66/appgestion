import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ProyectoTareasDTO, TareaLazyDTO } from '../../../core/models/project.model';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeModule } from 'primeng/tree'
import { TreeNode } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-proyectos-detalles',
  imports: [
    CommonModule,
    CardModule,
    TreeModule,
    TagModule
  ]
  ,
  templateUrl: './proyectos-detalles.component.html',
  styleUrls: ['./proyectos-detalles.component.css']
})
export class ProyectosDetallesComponent implements OnInit {

  proyecto: ProyectoTareasDTO | null = null;
  taskTree: TreeNode[] = [];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
  ) { }

  private cdr = inject(ChangeDetectorRef);

private mapTaskToTreeNode(task: TareaLazyDTO): TreeNode {
  const hasUnknownChildren = task.subtareas === null; 
  const hasKnownChildren = Array.isArray(task.subtareas);

  const children = hasKnownChildren
    ? (task.subtareas as TareaLazyDTO[]).map(t => this.mapTaskToTreeNode(t))
    : undefined;

  return {
    key: task.id.toString(),
    label: task.nombre,
    data: task,
    icon: 'pi pi-list',
    children,

    leaf: hasKnownChildren ? children!.length === 0 : false
  }
}






  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(projectId);
  }

  loadProject(id: number) {
    this.projectService.findById(id).subscribe({
      next: (res) => {
        this.proyecto = res;

        this.taskTree = (res.tareas_principales || []).map(t =>
          this.mapTaskToTreeNode(t)
        );

        this.cdr.markForCheck();
      }
    });
  }

onNodeExpand(event: any) {
  const node = event.node as TreeNode;
  const task = node.data as TareaLazyDTO;

  if (node.children && node.children.length > 0) {
    return;
  }

  node.loading = true;

  this.taskService.findById(task.id).subscribe({
    next: (res) => {
      const sub = res.subtareas ?? []; 
      node.children = sub.map(t => this.mapTaskToTreeNode(t));


      node.leaf = node.children.length === 0;

      node.loading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      node.loading = false;
    }
  });
}





}
