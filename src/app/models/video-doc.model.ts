import { videoMod } from './videoMod.model';

/**
 * Forma de un documento de la colección `videos` en Firestore. Extiende
 * `videoMod` para que `reel-card.component.ts` (que solo espera un
 * `videoMod`) siga funcionando sin cambios.
 */
export interface VideoDoc extends videoMod {
  categoriaId: string;
  orden: number;
  activo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy: string | null;
}
