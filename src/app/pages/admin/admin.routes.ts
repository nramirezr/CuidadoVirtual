import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell/admin-shell.component';
import { adminGuard } from './admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    // Ruta hermana, fuera del guard: si estuviera adentro, un visitante sin
    // sesión quedaría en loop (guard redirige a login -> login está guardado
    // -> redirige a login...).
    path: 'login',
    loadComponent: () =>
      import('./admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Admin - Ingresar'
  },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [adminGuard],
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
