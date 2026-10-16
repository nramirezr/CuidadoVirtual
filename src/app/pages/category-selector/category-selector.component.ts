import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { CategoriaDoc } from '../../models/categoria-doc.model';
import { categoriasConVideo, primerVideoDeCategoria } from '../../utils/categorias.util';
import { ReelsPlayerPoolService } from '../../services/reels-player-pool.service';
import { VideoDoc } from '../../models/video-doc.model';
import { slugify } from '../../utils/slug.util';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [RouterLink, MatListModule],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.css'
})
export class CategorySelectorComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly videosService = inject(VideosService);
  private readonly pool = inject(ReelsPlayerPoolService);
  private videos: VideoDoc[] = [];

  readonly categorias = signal<CategoriaDoc[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  constructor() {
    // Los reproductores deben existir ANTES del toque en la categoría (ver iniciarSonido).
    this.pool.asegurar();
    this.cargar();
  }

  /**
   * Toque en una categoría (o en "Ver todos" si es `null`): es el gesto real de
   * la persona que el navegador exige para permitir sonido. Se aprovecha para
   * desbloquearlo y arrancar ya el primer video, sin pedir ningún toque extra.
   */
  iniciarSonido(categoria: CategoriaDoc | null): void {
    const primero = primerVideoDeCategoria(this.videos, categoria ? categoria.id : null);
    this.pool.iniciarDesdeGesto(primero?.fuente === 'youtube' ? primero.youtubeId : undefined);
  }

  slugFor(categoria: CategoriaDoc): string {
    return categoria.slug || slugify(categoria.nombre);
  }

  private async cargar(): Promise<void> {
    try {
      const [categorias, videos] = await Promise.all([
        this.categoriesService.categoriasOneShot(),
        this.videosService.videosOneShot()
      ]);
      this.videos = videos;
      this.categorias.set(categoriasConVideo(categorias, videos));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
