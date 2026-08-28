import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { findCategoriaBySlug } from '../../data/categorias';
import { videos } from '../../data/videos';
import { videoMod } from '../../models/videoMod.model';

@Component({
  selector: 'app-reels-feed',
  standalone: true,
  imports: [RouterLink, ReelCardComponent],
  templateUrl: './reels-feed.component.html',
  styleUrl: './reels-feed.component.css'
})
export class ReelsFeedComponent {
  private readonly allVideos: videoMod[] = videos;

  /**
   * Bindeado automáticamente desde el segmento :categoriaSlug de la ruta.
   * En la ruta /videos (sin ese segmento) => modo "Ver todos". Ojo:
   * withComponentInputBinding() fuerza el input a `undefined` (no al default
   * declarado abajo) cuando la ruta activa no trae el parámetro, así que se
   * chequea por falsy en vez de comparar estrictamente contra ''.
   */
  readonly categoriaSlug = input<string>('');

  readonly modoTodos = computed(() => !this.categoriaSlug());

  readonly categoriaActual = computed(() =>
    this.modoTodos() ? null : findCategoriaBySlug(this.categoriaSlug()) ?? null
  );

  /** true solo cuando había un slug en la URL y no calzó con ninguna categoría. */
  readonly categoriaNoEncontrada = computed(() => !this.modoTodos() && this.categoriaActual() === null);

  readonly videosFiltrados = computed(() => {
    if (this.modoTodos()) {
      return this.allVideos;
    }
    const categoria = this.categoriaActual();
    return categoria ? this.allVideos.filter((v) => v.categoria === categoria.nombre) : [];
  });
}
