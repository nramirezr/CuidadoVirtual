import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Portada del sitio: permite elegir entre la versión 2025 (sitio anterior,
 * alojado aparte) y la versión 2026 (esta aplicación, que arranca en su
 * pantalla de bienvenida).
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {}
