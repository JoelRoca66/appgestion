import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { RecordService } from '../../../core/services/record.service';
import { Record } from '../../../core/models/record.model';
import { PageResponse } from '../../../core/services/record.service';

@Component({
  selector: 'app-jornadas-no-validadas',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, ConfirmDialogModule, ToastModule, TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './JornadaNoValidada.html',
  styleUrl: './JornadaNoValidada.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JornadaNoValidada {
  @ViewChild('dt') dt!: Table;

  records: Record[] = [];
  totalRecords = 0;
  loading = false;
  lastTableEvent: TableLazyLoadEvent | null = null;
  currentRequest: Subscription | null = null;

  constructor(
    private recordService: RecordService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  private parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;
    let d: Date;
    if (Array.isArray(dateValue)) {
      d = new Date(dateValue[0], (dateValue[1] || 1) - 1, dateValue[2] || 1, dateValue[3] || 0, dateValue[4] || 0);
    } else {
      d = new Date(dateValue);
    }
    return isNaN(d.getTime()) ? undefined : d;
  }

  loadRecords(event: TableLazyLoadEvent) {
    this.lastTableEvent = event;
    this.loading = true;
    this.cdr.markForCheck();

    if (this.currentRequest) this.currentRequest.unsubscribe();

    const page = (event.first ?? 0) / (event.rows ?? 10);
    const size = event.rows ?? 10;

    this.currentRequest = this.recordService.getNoValdidas(page, size)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: PageResponse<Record>) => {
          this.records = (response.content ?? []).map(r => ({
            ...r,
            fecha: this.parseDate(r.fecha) || new Date()
          }));
          this.totalRecords = response.totalElements ?? this.records.length;
        },
        error: (err) => {
          console.error('Error cargando no validadas', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las jornadas' });
        }
      });
  }


  confirmarAccion(tipo: 'validar' | 'eliminar', r: Record) {
    const esValidar = tipo === 'validar';

    this.confirmationService.confirm({
      header: esValidar ? 'Confirmar Validación' : 'Confirmar Eliminación',
      icon: esValidar ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
      message: esValidar
        ? `¿Quieres validar la jornada de ${r.horas}h del día ${new Date(r.fecha).toLocaleDateString()}?`
        : `¿Estás seguro de eliminar la jornada de ${r.horas}h del día ${new Date(r.fecha).toLocaleDateString()}?`,
      acceptButtonStyleClass: esValidar ? 'p-button-success' : 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: esValidar ? 'Validar' : 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (esValidar) {
          const actualizado: Record = { ...r, validado: true };
          this.recordService.updateRecord(actualizado).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Validada',
                detail: 'La jornada fue validada correctamente'
              });
              this.reloadCurrentPage();
            },
            error: (err) => {
              console.error('Error validando', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo validar la jornada'
              });
            }
          });
        } else {
          this.recordService.deleteRecord(r.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: 'La jornada fue eliminada correctamente'
              });
              this.reloadCurrentPage();
            },
            error: (err) => {
              console.error('Error eliminando', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la jornada'
              });
            }
          });
        }
      }
    });
  }

  reloadCurrentPage() {
    if (this.lastTableEvent) {
      this.loadRecords(this.lastTableEvent);
    } else if (this.dt) {
      this.dt.reset();
    }
  }
}
