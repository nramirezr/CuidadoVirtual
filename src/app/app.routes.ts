import { Routes } from '@angular/router';
import { BienvenidaComponent } from './pages/bienvenida/bienvenida.component';
import { InicioComponent } from './pages/inicio/inicio.component';

export const routes: Routes = [
  // Portada: elegir entre la versión 2025 (sitio anterior) y la 2026 (esta app).
  { path: '', component: InicioComponent, title: 'Asistente Virtual para Cuidadores' },
  { path: 'bienvenida', component: BienvenidaComponent, title: 'Cuidado Virtual - Bienvenida' },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/category-selector/category-selector.component').then(
        (m) => m.CategorySelectorComponent
      ),
    title: 'Cuidado Virtual - Categorías'
  },
  {
    // Sin categoría: modo "Ver todos", recorre el feed completo sin filtrar.
    path: 'videos',
    loadComponent: () =>
      import('./pages/reels-feed/reels-feed.component').then((m) => m.ReelsFeedComponent),
    title: 'Cuidado Virtual - Todos los videos'
  },
  {
    path: 'videos/:categoriaSlug',
    loadComponent: () =>
      import('./pages/reels-feed/reels-feed.component').then((m) => m.ReelsFeedComponent),
    title: 'Cuidado Virtual - Videos'
  },
  // Rutas antiguas: se redirigen por si algún QR/material impreso ya las referencia.
  { path: 'inicio', redirectTo: 'bienvenida' },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
