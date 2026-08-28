import { Injectable, computed, signal } from '@angular/core';
import { categorias as categoriasIniciales } from '../data/categorias';
import { videos as videosIniciales } from '../data/videos';
import { categoriasMod } from '../models/categoriasMod.model';
import { videoMod } from '../models/videoMod.model';

export interface AdminCategoria extends categoriasMod {
  readonly id: string;
}

function nuevoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Prototipo de datos para la vista de administrador: clona en memoria las
 * categorías/videos estáticos que usa la app pública y expone operaciones CRUD
 * sobre signals. Nunca escribe de vuelta sobre `data/categorias.ts`/`data/videos.ts`
 * ni sobre ningún backend — es solo para visualizar el flujo de administración.
 * Los cambios viven mientras dura la sesión del navegador y se pierden al recargar.
 */
@Injectable({ providedIn: 'root' })
export class AdminMockDataService {
  private readonly categoriasState = signal<AdminCategoria[]>(
    structuredClone(categoriasIniciales).map((c: categoriasMod) => ({ ...c, id: nuevoId() }))
  );

  private readonly videosState = signal<videoMod[]>(structuredClone(videosIniciales));

  readonly categorias = this.categoriasState.asReadonly();
  readonly videos = this.videosState.asReadonly();

  readonly categoriasConConteo = computed(() =>
    this.categoriasState().map((c) => ({
      ...c,
      videoCount: this.videosState().filter((v) => v.categoria === c.nombre).length
    }))
  );

  videosDeCategoria(categoriaNombre: string): videoMod[] {
    return this.videosState().filter((v) => v.categoria === categoriaNombre);
  }

  agregarCategoria(datos: categoriasMod): void {
    this.categoriasState.update((lista) => [...lista, { ...datos, id: nuevoId() }]);
  }

  actualizarCategoria(id: string, datos: categoriasMod): void {
    const anterior = this.categoriasState().find((c) => c.id === id);
    this.categoriasState.update((lista) =>
      lista.map((c) => (c.id === id ? { ...c, ...datos } : c))
    );
    // El vínculo categoría-video es por nombre (igual que en los datos reales de la
    // app): si se renombra la categoría, sus videos se actualizan en cascada.
    if (anterior && anterior.nombre !== datos.nombre) {
      this.videosState.update((lista) =>
        lista.map((v) => (v.categoria === anterior.nombre ? { ...v, categoria: datos.nombre } : v))
      );
    }
  }

  eliminarCategoria(id: string): void {
    const categoria = this.categoriasState().find((c) => c.id === id);
    this.categoriasState.update((lista) => lista.filter((c) => c.id !== id));
    if (categoria) {
      this.videosState.update((lista) => lista.filter((v) => v.categoria !== categoria.nombre));
    }
  }

  reordenarCategorias(idsEnOrden: string[]): void {
    this.categoriasState.update((lista) => {
      const porId = new Map(lista.map((c) => [c.id, c]));
      return idsEnOrden.map((id) => porId.get(id)).filter((c): c is AdminCategoria => !!c);
    });
  }

  agregarVideo(categoriaNombre: string, datos: Omit<videoMod, 'id' | 'categoria'>): void {
    const nuevo: videoMod = {
      ...datos,
      id: nuevoId(),
      categoria: categoriaNombre,
      esPlaceholder: datos.esPlaceholder ?? true
    };
    this.videosState.update((lista) => [...lista, nuevo]);
  }

  actualizarVideo(id: string, datos: Partial<Omit<videoMod, 'id' | 'categoria'>>): void {
    this.videosState.update((lista) => lista.map((v) => (v.id === id ? { ...v, ...datos } : v)));
  }

  eliminarVideo(id: string): void {
    this.videosState.update((lista) => lista.filter((v) => v.id !== id));
  }
}
