export type FuenteVideo = 'youtube' | 'mp4';

export interface videoMod {
  id: string;
  categoria: string; // debe calzar exacto con categoriasMod.nombre
  titulo: string;
  descripcion: string;
  fuente: FuenteVideo;
  youtubeId?: string; // requerido si fuente === 'youtube'
  mp4Url?: string; // requerido si fuente === 'mp4'
  posterUrl?: string;
  esPlaceholder?: boolean; // true = contenido de demo, reemplazar antes de producción
}
