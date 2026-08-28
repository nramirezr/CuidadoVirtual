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

  /** Bindeado automáticamente desde el segmento :categoriaSlug de la ruta. */
  readonly categoriaSlug = input<string>('');

  readonly categoriaActual = computed(() => findCategoriaBySlug(this.categoriaSlug()) ?? null);

  readonly videosFiltrados = computed(() => {
    const categoria = this.categoriaActual();
    return categoria ? this.allVideos.filter((v) => v.categoria === categoria.nombre) : [];
  });
}
