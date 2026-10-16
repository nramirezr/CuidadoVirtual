import { primerVideoDeCategoria } from './categorias.util';
import { videoMod } from '../models/videoMod.model';

type V = videoMod & { categoriaId?: string; orden?: number };

function v(id: string, categoriaId: string, orden: number): V {
  return {
    id,
    categoria: categoriaId,
    categoriaId,
    orden,
    titulo: id,
    descripcion: '',
    fuente: 'youtube',
    youtubeId: id
  };
}

describe('primerVideoDeCategoria', () => {
  const videos = [v('c', 'x', 2), v('a', 'y', 5), v('b', 'x', 1)];

  it('should return the video with the lowest "orden" of that category, like the feed shows it', () => {
    expect(primerVideoDeCategoria(videos, 'x')?.id).toBe('b');
  });

  it('should return the first one of the list for "Ver todos" (null category)', () => {
    expect(primerVideoDeCategoria(videos, null)?.id).toBe('c');
  });

  it('should return undefined when the category has no videos', () => {
    expect(primerVideoDeCategoria(videos, 'z')).toBeUndefined();
  });

  it('should not mutate the original list', () => {
    const copia = [...videos];
    primerVideoDeCategoria(videos, 'x');
    expect(videos).toEqual(copia);
  });
});
