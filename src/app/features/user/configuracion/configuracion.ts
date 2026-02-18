import { AuthService } from './../../../core/services/auth.service';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  AfterViewInit,
  inject,
  signal,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { WorkerService } from '../../../core/services/worker.service';
import { Worker } from '../../../core/models/worker.model';

import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { take } from 'rxjs';
import { User } from '../../../core/models/user.model';

interface CurrentUserSession {
  id_trabajador: number;
  rol: boolean;
  usuario: string;
  cambio_contrasena: boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    CardModule,
    TagModule,
    DividerModule,
    ChipModule,
    SkeletonModule,
    ToastModule,
    ButtonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class Configuracion implements OnInit, AfterViewInit {

  private workerService = inject(WorkerService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  worker = signal<Worker | null>(null);
  session = signal<CurrentUserSession | null>(null);

  editDialogVisible = signal(false);
  passwordDialogVisible = signal(false);
 
  editForm: FormGroup | null = null;
  passwordForm: FormGroup | null = null;

  private hasInitialized = false;

  private DNI_REGEX = /^[0-9]{8}[A-Za-z]$/;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    setTimeout(() => this.init(), 0);
  }

  private init(): void {
    try {
      const current = this.readUserFromStorage();
      if (!current) {
        throw new Error('No se encontró la sesión actual.');
      }

      this.session.set(current);

      if (!current.id_trabajador) {
        throw new Error('La sesión no contiene id_trabajador.');
      }

      this.fetchWorker(current.id_trabajador);

    } catch (e: any) {
      this.loading.set(false);
      const msg = e?.message ?? 'Error leyendo la sesión.';
      this.error.set(msg);
      this.messageService.add({
        severity: 'error',
        summary: 'Sesión',
        detail: msg
      });
    }
  }

  private readUserFromStorage(): CurrentUserSession | null {
    const raw = sessionStorage.getItem('currentUser') ?? localStorage.getItem('currentUser');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as CurrentUserSession;
    } catch {
      return null;
    }
  }

  private fetchWorker(id: number): void {
    this.loading.set(true);
    this.workerService.findById(id)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.worker.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const detail = err?.error?.message || 'No se pudo cargar el trabajador.';
          this.error.set(detail);
          this.messageService.add({
            severity: 'error',
            summary: 'Carga',
            detail
          });
        }
      });
  }

  reload(): void {
    const s = this.session();
    if (s?.id_trabajador) this.fetchWorker(s.id_trabajador);
  }


  openEdit(): void {
    const w = this.worker();
    if (!w) return;
    this.editForm = this.fb.group({
      nombre: [w.nombre ?? '', [Validators.required]],
      apellido: [w.apellido ?? ''],
      dni: [w.dni ?? '', [Validators.required, Validators.pattern(this.DNI_REGEX)]],
    });

    this.editDialogVisible.set(true);
  }

openPasswordDialog(): void {
  this.passwordForm = this.fb.group({
    nueva: ['', [Validators.required, Validators.minLength(4)]],
    repetir: ['', [Validators.required]]
  });

  this.passwordDialogVisible.set(true);
}

  saveEdit(): void {

    if (!this.editForm || !this.worker()) {
      return;
    }
    const form = this.editForm; 
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const current = this.worker()!;
    const { nombre, apellido, dni } = form.value as { nombre: string; apellido: string; dni: string };

    const payload: Worker = {
      ...current,
      nombre,
      apellido,
      dni
    };

    this.loading.set(true);

    this.workerService.update(payload).subscribe({
      next: (updated) => {
        this.worker.set(updated);
        this.editDialogVisible.set(false);
        this.loading.set(false);

        this.messageService.add({
          severity: 'success',
          summary: 'Perfil',
          detail: 'Datos actualizados correctamente'
        });
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.message || 'No se pudo actualizar.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail
        });
      }
    });
  }

  
savePassword(): void {
  if (!this.passwordForm || this.passwordForm.invalid) {
    this.passwordForm?.markAllAsTouched();
    return;
  }

  const { nueva } = this.passwordForm.value;
  const session = this.session();
  if (!session) return;

  const userToUpdate: User = {
    id_trabajador: session.id_trabajador,
    rol: session.rol,
    usuario: session.usuario,
    cambio_contrasena: session.cambio_contrasena,
    contrasena: nueva
  };

  this.loading.set(true);

  this.authService.updatePassword(userToUpdate).subscribe({
    next: () => {
      this.loading.set(false);
      this.passwordDialogVisible.set(false);
      this.passwordForm = null;

      this.messageService.add({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: 'Se ha cambiado la contraseña correctamente'
      });
    },
    error: (err) => {
      this.loading.set(false);
      const detail = err?.error?.message || 'No se pudo actualizar la contraseña.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail
      });
    }
  });
}
}
