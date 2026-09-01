import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Protege las pantallas de administración reales. Espera a que Firebase
 * termine de resolver la sesión persistida (evita la carrera clásica de
 * "el guard corre antes de que se restaure el login") y solo deja pasar si
 * el usuario está autenticado Y figura en la lista blanca `admins/{uid}`.
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitUntilReady();

  return auth.isAdmin() ? true : router.parseUrl('/admin/login');
};
