import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CategoriesService } from '../../../services/categories.service';
import { VideosService } from '../../../services/videos.service';
import { ConfirmDialogComponent } from '../../../dialogs/confirm-dialog/confirm-dialog.component';
import { VideoFormSheetComponent } from '../video-form-sheet/video-form-sheet.component';
import { VideoDoc } from '../../../models/video-doc.model';

@Component({
  selector: 'app-admin-videos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-videos.component.html',
  styleUrl: './admin-videos.component.css'
})
export class AdminVideosComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly videosService = inject(VideosService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  /** Bindeado automáticamente desde el segmento :categoriaId de la ruta. */
  readonly categoriaId = input<string>('');

  private readonly categoriasTodas = toSignal(this.categoriesService.categoriasLive(), {
    initialValue: []
  });

  readonly categoria = computed(() =>
    this.categoriasTodas().find((c) => c.id === this.categoriaId())
  );

  readonly videos = toSignal(
    toObservable(this.categoriaId).pipe(
      switchMap((id) => (id ? this.videosService.videosDeCategoriaLive(id) : of([])))
    ),
    { initialValue: [] as VideoDoc[] }
  );

  agregar(): void {
    const cat = this.categoria();
    if (!cat) {
      return;
    }
    this.bottomSheet.open(VideoFormSheetComponent, {
      data: { categoriaId: cat.id, categoriaNombre: cat.nombre }
    });
  }

  editar(video: VideoDoc): void {
    const cat = this.categoria();
    if (!cat) {
      return;
    }
    this.bottomSheet.open(VideoFormSheetComponent, {
      data: { categoriaId: cat.id, categoriaNombre: cat.nombre, video }
    });
  }

  eliminar(video: VideoDoc): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '340px',
        data: {
          titulo: 'Eliminar video',
          mensaje: `¿Eliminar "${video.titulo}"? Esta acción no se puede deshacer.`
        }
      })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (confirmado) {
          await this.videosService.eliminarVideo(video.id);
        }
      });
  }
}
