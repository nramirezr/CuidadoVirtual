import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

/**
 * Envoltorio de todas las pantallas /admin (ya protegidas por `adminGuard`,
 * ver `admin.routes.ts`). Excluida de la indexación en la URL pública.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css'
})
export class AdminShellComponent {
  private readonly meta = inject(Meta);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;

  constructor() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  async salir(): Promise<void> {
    await this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
