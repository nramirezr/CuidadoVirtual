import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { CategoriaDoc } from '../../models/categoria-doc.model';
import { categoriasConVideo } from '../../utils/categorias.util';
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

  readonly categorias = signal<CategoriaDoc[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  constructor() {
    this.cargar();
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
      this.categorias.set(categoriasConVideo(categorias, videos));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
