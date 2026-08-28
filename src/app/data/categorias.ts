import { categoriasMod } from '../models/categoriasMod.model';
import { videoMod } from '../models/videoMod.model';
import { slugify } from '../utils/slug.util';

export const categorias: categoriasMod[] = [
  {
    nombre: 'Sonda Nasogástrica',
    icono: '💉👃🥛'
  },
  {
    nombre: 'Hipoglicemiantes',
    icono: '📉🍬'
  },
  {
    nombre: 'Anticoagulante',
    icono: '🩸'
  },
  {
    nombre: 'Traqueotomia',
    icono: '🫁  '
  },
  {
    nombre: 'Cateter Urinario Permanente',
    icono: '🚽  '
  },
  {
    nombre: 'Catéter Subcutáneo',
    icono: '💉 '
  },
  {
    nombre: 'Gastrostomía',
    icono: '🍼 '
  },
  {
    nombre: 'Analgésia y dolor',
    icono: '💊 '
  },
  {
    nombre: 'Prevención de caídas',
    icono: '🚧   '
  },
  {
    nombre: 'Apoyo Social',
    icono: '🤝  '
  },
  {
    nombre: 'Cuidados para el Cuidador',
    icono: '🫂 '
  }
];

/** Busca una categoría cuyo nombre, slugificado, calce con el slug de la URL. */
export function findCategoriaBySlug(slug: string): categoriasMod | undefined {
  return categorias.find((c) => slugify(c.nombre) === slug);
}

/** Categorías que tienen al menos un video asociado, en el listado dado. */
export function categoriasConVideo(videos: videoMod[]): categoriasMod[] {
  return categorias.filter((c) => videos.some((v) => v.categoria === c.nombre));
}
