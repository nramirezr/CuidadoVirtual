import { TestBed } from '@angular/core/testing';
import { AdminMockDataService } from './admin-mock-data.service';
import { categorias } from '../data/categorias';
import { videos } from '../data/videos';

describe('AdminMockDataService', () => {
  let service: AdminMockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminMockDataService);
  });

  it('should be created and seed from the static data', () => {
    expect(service).toBeTruthy();
    expect(service.categorias().length).toBe(categorias.length);
    expect(service.videos().length).toBe(videos.length);
  });

  it('should never mutate the real static data the public app uses', () => {
    const videosOriginales = videos.length;
    const categoriasOriginales = categorias.length;

    service.eliminarVideo(service.videos()[0].id);
    service.eliminarCategoria(service.categorias()[0].id);

    expect(videos.length).toBe(videosOriginales);
    expect(categorias.length).toBe(categoriasOriginales);
  });

  it('should add, update and delete a category', () => {
    const before = service.categorias().length;
    service.agregarCategoria({ nombre: 'Nueva categoría', icono: '🆕' });
    expect(service.categorias().length).toBe(before + 1);

    const creada = service.categorias().find((c) => c.nombre === 'Nueva categoría')!;
    service.actualizarCategoria(creada.id, { nombre: 'Categoría renombrada', icono: '🆕' });
    expect(service.categorias().find((c) => c.id === creada.id)?.nombre).toBe(
      'Categoría renombrada'
    );

    service.eliminarCategoria(creada.id);
    expect(service.categorias().length).toBe(before);
  });

  it('should cascade a category rename onto its videos', () => {
    const categoria = service.categorias()[0];
    const nombreOriginal = categoria.nombre;
    const nombreNuevo = `${nombreOriginal} (editado)`;

    service.actualizarCategoria(categoria.id, { nombre: nombreNuevo, icono: categoria.icono });

    expect(service.videosDeCategoria(nombreOriginal).length).toBe(0);
    expect(service.videosDeCategoria(nombreNuevo).length).toBeGreaterThan(0);
  });

  it('should remove a category videos when the category is deleted', () => {
    const categoria = service.categorias()[0];
    const videosPrevios = service.videosDeCategoria(categoria.nombre).length;
    expect(videosPrevios).toBeGreaterThan(0);

    service.eliminarCategoria(categoria.id);

    expect(service.videosDeCategoria(categoria.nombre).length).toBe(0);
  });

  it('should add, update and delete a video', () => {
    const categoria = service.categorias()[0];
    const before = service.videosDeCategoria(categoria.nombre).length;

    service.agregarVideo(categoria.nombre, {
      titulo: 'Video de prueba',
      descripcion: '',
      fuente: 'youtube',
      youtubeId: 'abc123'
    });
    expect(service.videosDeCategoria(categoria.nombre).length).toBe(before + 1);

    const creado = service.videosDeCategoria(categoria.nombre).find((v) => v.titulo === 'Video de prueba')!;
    service.actualizarVideo(creado.id, { titulo: 'Video editado' });
    expect(service.videos().find((v) => v.id === creado.id)?.titulo).toBe('Video editado');

    service.eliminarVideo(creado.id);
    expect(service.videosDeCategoria(categoria.nombre).length).toBe(before);
  });

  it('should reorder categories', () => {
    const ids = service.categorias().map((c) => c.id);
    const reordenados = [...ids].reverse();

    service.reordenarCategorias(reordenados);

    expect(service.categorias().map((c) => c.id)).toEqual(reordenados);
  });
});
