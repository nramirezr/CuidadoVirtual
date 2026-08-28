import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell/admin-shell.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', redirectTo: 'categorias', pathMatch: 'full' },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent
          ),
        title: 'Admin - Categorías'
      },
      {
        path: 'categorias/:categoriaId/videos',
        loadComponent: () =>
          import('./admin-videos/admin-videos.component').then((m) => m.AdminVideosComponent),
        title: 'Admin - Videos'
      }
    ]
  }
];
