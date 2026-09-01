import { categoriasMod } from './categoriasMod.model';

/**
 * Forma de un documento de la colección `categorias` en Firestore. Extiende
 * `categoriasMod` (la forma "pública"/de display que ya usan `reel-card` y el
 * resto de la app) para que todo lo que hoy espera un `categoriasMod` siga
 * funcionando sin cambios.
 */
export interface CategoriaDoc extends categoriasMod {
  readonly id: string;
  slug: string;
  orden: number;
  activa: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
