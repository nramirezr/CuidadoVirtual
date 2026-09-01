import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { CategoriaDoc } from '../../models/categoria-doc.model';
import { VideoDoc } from '../../models/video-doc.model';

interface FeedState {
  cargando: boolean;
  categoria: CategoriaDoc | null;
  videos: VideoDoc[];
  noEncontrada: boolean;
}

const ESTADO_INICIAL: FeedState = {
  cargando: true,
  categoria: null,
  videos: [],
  noEncontrada: false
};

@Component({
  selector: 'app-reels-feed',
  standalone: true,
  imports: [RouterLink, ReelCardComponent],
  templateUrl: './reels-feed.component.html',
  styleUrl: './reels-feed.component.css'
})
export class ReelsFeedComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly videosService = inject(VideosService);

  /**
   * Bindeado automáticamente desde el segmento :categoriaSlug de la ruta.
   * Vacío en la ruta /videos (sin ese segmento) => modo "Ver todos". Ojo:
   * withComponentInputBinding() fuerza el input a `undefined` (no al default
   * declarado abajo) cuando la ruta activa no trae el parámetro, así que se
   * chequea por falsy en vez de comparar estrictamente contra ''.
   */
  readonly categoriaSlug = input<string>('');

  readonly modoTodos = computed(() => !this.categoriaSlug());

  private readonly estado = toSignal(
    toObservable(this.categoriaSlug).pipe(
      switchMap(async (slug): Promise<FeedState> => {
        if (!slug) {
          const videos = await this.videosService.videosOneShot();
          return { cargando: false, categoria: null, videos, noEncontrada: false };
        }
        const categoria = await this.categoriesService.findBySlug(slug);
        if (!categoria) {
          return { cargando: false, categoria: null, videos: [], noEncontrada: true };
        }
        const videos = await this.videosService.videosDeCategoriaOneShot(categoria.id);
        return { cargando: false, categoria, videos, noEncontrada: false };
      })
    ),
    { initialValue: ESTADO_INICIAL }
  );

  readonly cargando = computed(() => this.estado().cargando);
  readonly categoriaActual = computed(() => this.estado().categoria);

  /** true solo cuando había un slug en la URL y no calzó con ninguna categoría. */
  readonly categoriaNoEncontrada = computed(() => this.estado().noEncontrada);

  readonly videosFiltrados = computed(() => this.estado().videos);
}
