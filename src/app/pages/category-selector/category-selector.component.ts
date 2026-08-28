import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { categoriasConVideo } from '../../data/categorias';
import { videos } from '../../data/videos';
import { categoriasMod } from '../../models/categoriasMod.model';
import { slugify } from '../../utils/slug.util';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [RouterLink, MatListModule],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.css'
})
export class CategorySelectorComponent {
  readonly categorias: categoriasMod[] = categoriasConVideo(videos);

  slugFor(categoria: categoriasMod): string {
    return slugify(categoria.nombre);
  }
}
