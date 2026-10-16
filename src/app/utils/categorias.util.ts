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

/**
 * Primer video que mostrará el feed de una categoría ("Ver todos" si es
 * `null`): mismas reglas que el feed (los de la categoría ordenados por
 * `orden`; sin categoría, la lista tal cual).
 */
export function primerVideoDeCategoria<V extends videoMod & { categoriaId?: string; orden?: number }>(
  videos: V[],
  categoriaId: string | null
): V | undefined {
  if (categoriaId === null) {
    return videos[0];
  }
  return videos
    .filter((v) => v.categoriaId === categoriaId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0];
}
