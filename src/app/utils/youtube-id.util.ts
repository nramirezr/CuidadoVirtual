const ID_PURO = /^[\w-]{11}$/;
const PATRONES_URL = [
  /(?:youtube\.com|m\.youtube\.com)\/watch\?(?:.*&)?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /(?:youtube\.com|m\.youtube\.com)\/shorts\/([\w-]{11})/,
  /(?:youtube\.com|m\.youtube\.com)\/embed\/([\w-]{11})/
];

/**
 * Extrae el ID de un video de YouTube (11 caracteres) a partir de lo que el
 * admin pegue en el campo: el ID puro, o una URL completa — de un video
 * normal (watch?v=), un short (/shorts/), un link corto (youtu.be) o un
 * embed. Si no reconoce el formato, devuelve el texto recortado tal cual
 * (para no romper silenciosamente casos que no se anticiparon aquí).
 */
export function extractYoutubeId(input: string): string {
  const value = (input ?? '').trim();
  if (!value) {
    return value;
  }
  if (ID_PURO.test(value)) {
    return value;
  }
  for (const patron of PATRONES_URL) {
    const match = value.match(patron);
    if (match) {
      return match[1];
    }
  }
  return value;
}
