import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ProjectFilter } from '../../../core/models/projectFilter.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Route, Router, RouterModule } from '@angular/router';

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

@Component({
  selector: 'app-proyectos-component',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, InputTextModule, ButtonModule,
    SelectModule, InputNumberModule, DatePickerModule, PopoverModule,
    ChipModule, ProgressBarModule, TagModule,RouterModule
  ],
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProyectosComponent implements OnInit {

  @ViewChild('dt') dt!: Table;

  projects: Project[] = [];
  totalRecords = 0;
  loading = false;
  lastTableEvent: TableLazyLoadEvent | null = null;

  estados = [
    { label: 'En Progreso', value: 'EN_PROGRESO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'Cancelado', value: 'CANCELADO' }
  ];

  searchTerm = '';
  searchSubject = new Subject<string>();

  filterEstado: string | null = null;
  filterMargenMin: number | null = null;
  filterFechaIniDesde: Date | null = null;
  filterFechaIniHasta: Date | null = null;
  filterFechaFinDesde: Date | null = null;
  filterFechaFinHasta: Date | null = null;

  activeFilters: ActiveFilter[] = [];

  constructor(private projectService: ProjectService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.dt.reset();
    });
  }

  loadProjects(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    this.loading = true;
    this.cdr.markForCheck();

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    const filterParams: ProjectFilter = {
      texto: this.searchTerm,
      estado: this.filterEstado ?? undefined,
      margen_beneficio_min: this.filterMargenMin ?? undefined,
      fecha_inicio_desde: this.filterFechaIniDesde ?? undefined,
      fecha_inicio_hasta: this.filterFechaIniHasta ?? undefined,
      fecha_fin_desde: this.filterFechaFinDesde ?? undefined,
      fecha_fin_hasta: this.filterFechaFinHasta ?? undefined
    };

    this.projectService.searchProject(filterParams, page, size).subscribe({
      next: response => {
        this.projects = response.content.map(p => ({
          ...p,
          fechaIni: p.fecha_ini ? new Date(p.fecha_ini) : undefined,
          fechaFin: p.fecha_fin ? new Date(p.fecha_fin) : undefined
        } as Project));
        this.totalRecords = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  applyFilters() {
    const filters: ActiveFilter[] = [];

    if (this.filterEstado) {
      const label = this.estados.find(e => e.value === this.filterEstado)?.label || this.filterEstado;
      filters.push({ key: 'estado', label: `Estado: ${label}`, value: this.filterEstado });
    }
    if (this.filterMargenMin !== null) filters.push({ key: 'margen', label: `Margen Min: ${this.filterMargenMin}%`, value: this.filterMargenMin });
    if (this.filterFechaIniDesde) filters.push({ key: 'fDesde', label: `Inicio Desde: ${this.filterFechaIniDesde.toLocaleDateString()}`, value: this.filterFechaIniDesde });
    if (this.filterFechaIniHasta) filters.push({ key: 'fHasta', label: `Inicio Hasta: ${this.filterFechaIniHasta.toLocaleDateString()}`, value: this.filterFechaIniHasta });
    if (this.filterFechaFinDesde) filters.push({ key: 'fFinDesde', label: `Fin Desde: ${this.filterFechaFinDesde.toLocaleDateString()}`, value: this.filterFechaFinDesde });
    if (this.filterFechaFinHasta) filters.push({ key: 'fFinHasta', label: `Fin Hasta: ${this.filterFechaFinHasta.toLocaleDateString()}`, value: this.filterFechaFinHasta });

    this.activeFilters = filters;
    this.dt.reset();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterEstado = null;
    this.filterMargenMin = null;
    this.filterFechaIniDesde = null;
    this.filterFechaIniHasta = null;
    this.filterFechaFinDesde = null;
    this.filterFechaFinHasta = null;
    this.activeFilters = [];
    this.dt.reset();
  }

  getProgreso(p: Project): number {
    if (!p.totalTareas || p.totalTareas === 0) return 0;
    return Math.round(((p.tareasCompletadas || 0) / p.totalTareas) * 100);
  }

  getSeverity(estado: string) {
    switch (estado) {
      case 'COMPLETADO': return 'success';
      case 'EN_PROGRESO': return 'info';
      case 'PENDIENTE': return 'warn';
      case 'CANCELADO': return 'danger';
      default: return 'secondary';
    }
  }
  goToProjectDetail(projectId: number) {
  this.router.navigate(['/user/proyectos', projectId]);
}


}
