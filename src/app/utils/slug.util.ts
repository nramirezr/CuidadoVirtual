const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g');
const NON_ALPHANUMERIC = new RegExp('[^a-z0-9]+', 'g');
const EDGE_DASHES = new RegExp('(^-|-$)', 'g');

/**
 * Convierte un nombre de categoría en un slug apto para URL (sin tildes, minúsculas,
 * separado por guiones). Puramente derivado del nombre: no se persiste en ningún
 * lado, así que si el nombre de una categoría cambia, su slug cambia con él.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(EDGE_DASHES, '');
}
