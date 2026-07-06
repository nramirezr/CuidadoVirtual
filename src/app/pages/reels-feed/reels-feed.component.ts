import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { categorias } from '../../data/categorias';
import { videos } from '../../data/videos';
import { videoMod } from '../../models/videoMod.model';

@Component({
  selector: 'app-reels-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, MatChipsModule, ReelCardComponent],
  templateUrl: './reels-feed.component.html',
  styleUrl: './reels-feed.component.css'
})
export class ReelsFeedComponent {
  private readonly allVideos: videoMod[] = videos;

  @ViewChild('scrollContainer') scrollContainerRef?: ElementRef<HTMLElement>;

  readonly categoriasConVideo = computed(() =>
    categorias.filter((c) => this.allVideos.some((v) => v.categoria === c.nombre))
  );

  readonly categoriaSeleccionada = signal<string | null>(null);
  readonly filtrosAbiertos = signal(false);

  readonly videosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    return categoria ? this.allVideos.filter((v) => v.categoria === categoria) : this.allVideos;
  });

  toggleFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  seleccionarCategoria(categoria: string | null): void {
    this.categoriaSeleccionada.set(categoria);
    this.filtrosAbiertos.set(false);
    queueMicrotask(() => {
      if (this.scrollContainerRef) {
        this.scrollContainerRef.nativeElement.scrollTop = 0;
      }
    });
  }

  trackByVideoId(_index: number, video: videoMod): string {
    return video.id;
  }
}
