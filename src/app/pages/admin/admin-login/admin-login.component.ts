import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly enviando = signal(false);
  readonly errorMsg = signal<string | null>(null);

  async ingresar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMsg.set(null);
    this.enviando.set(true);

    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email, password);

      if (!this.auth.isAdmin()) {
        await this.auth.logout();
        this.errorMsg.set('Esta cuenta no tiene permisos de administrador.');
        return;
      }

      this.router.navigateByUrl('/admin/categorias');
    } catch (error) {
      // Mensaje genérico deliberado: no distinguir "no existe" de "clave
      // incorrecta" para no facilitar enumerar cuentas.
      if (error instanceof FirebaseError) {
        this.errorMsg.set('Correo o contraseña incorrectos.');
      } else {
        this.errorMsg.set('No se pudo iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
