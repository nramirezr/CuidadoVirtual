import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { ReelsPlayerPoolService } from '../../services/reels-player-pool.service';
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
export class ReelsFeedComponent implements OnDestroy {
  private readonly categoriesService = inject(CategoriesService);
  private readonly videosService = inject(VideosService);
  private readonly pool = inject(ReelsPlayerPoolService);

  private resizeObserver?: ResizeObserver;
  private viewportEl?: HTMLElement;

  /**
   * El área de video aparece y desaparece con el estado (cargando / lista). Los
   * reproductores compartidos viven en una capa fija de la app (AppComponent);
   * aquí solo se la ubica exactamente detrás de la lista y se la oculta al
   * salir. Los iframes no se destruyen.
   */
  @ViewChild('viewport')
  set viewport(ref: ElementRef<HTMLElement> | undefined) {
    this.resizeObserver?.disconnect();
    if (ref) {
      this.viewportEl = ref.nativeElement;
      this.ubicarCapa();
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.ubicarCapa());
        this.resizeObserver.observe(this.viewportEl);
      }
    } else if (this.viewportEl) {
      // Solo si antes hubo área de video: al llegar desde una categoría el feed
      // arranca "cargando" (sin área) y no debe cortar el video ya iniciado.
      this.viewportEl = undefined;
      this.pool.ocultarCapa();
    }
  }

  constructor() {
    this.pool.asegurar();
  }

  private ubicarCapa(): void {
    if (this.viewportEl) {
      this.pool.mostrarCapa(this.viewportEl.getBoundingClientRect());
    }
  }

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

  onScroll(): void {
    this.pool.marcarMovimiento();
  }

  /** Fin de un toque/swipe: gesto válido para que Safari permita sonido. */
  onGesto(): void {
    this.pool.desbloquearAudio();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.viewportEl = undefined;
    this.pool.ocultarCapa();
  }
}
