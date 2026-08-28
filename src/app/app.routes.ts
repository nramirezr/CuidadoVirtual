import { Routes } from '@angular/router';
import { BienvenidaComponent } from './pages/bienvenida/bienvenida.component';

export const routes: Routes = [
  { path: '', component: BienvenidaComponent, title: 'Cuidado Virtual - Bienvenida' },
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
  { path: 'bienvenida', redirectTo: '' },
  { path: 'inicio', redirectTo: '' },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
