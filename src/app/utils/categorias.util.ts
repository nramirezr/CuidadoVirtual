import { categoriasMod } from '../models/categoriasMod.model';
import { videoMod } from '../models/videoMod.model';

/**
 * Categorías (de la lista dada) que tienen al menos un video (de la lista
 * dada) asociado. Genérico para poder usarse tanto con los `CategoriaDoc[]`/
 * `VideoDoc[]` reales de Firestore como con cualquier `categoriasMod[]`/
 * `videoMod[]`.
 */
export function categoriasConVideo<C extends categoriasMod, V extends videoMod>(
  categorias: C[],
  videos: V[]
): C[] {
  return categorias.filter((c) => videos.some((v) => v.categoria === c.nombre));
}
