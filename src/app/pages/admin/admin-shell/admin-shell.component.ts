import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Meta } from '@angular/platform-browser';

/**
 * Envoltorio de todas las pantallas /admin. No hay sesión/login real (ver
 * AdminMockDataService) así que en vez de un guard falso, se deja bien visible
 * que esto es un prototipo y se excluye de la indexación en la URL pública.
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

  constructor() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
