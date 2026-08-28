import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';
import { ConfirmDialogComponent } from '../../../dialogs/confirm-dialog/confirm-dialog.component';
import { VideoFormSheetComponent } from '../video-form-sheet/video-form-sheet.component';
import { videoMod } from '../../../models/videoMod.model';

@Component({
  selector: 'app-admin-videos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-videos.component.html',
  styleUrl: './admin-videos.component.css'
})
export class AdminVideosComponent {
  private readonly adminData = inject(AdminMockDataService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  /** Bindeado automáticamente desde el segmento :categoriaId de la ruta. */
  readonly categoriaId = input<string>('');

  readonly categoria = computed(() =>
    this.adminData.categorias().find((c) => c.id === this.categoriaId())
  );

  readonly videos = computed(() => {
    const cat = this.categoria();
    return cat ? this.adminData.videosDeCategoria(cat.nombre) : [];
  });

  agregar(): void {
    const cat = this.categoria();
    if (!cat) {
      return;
    }
    this.bottomSheet.open(VideoFormSheetComponent, { data: { categoriaNombre: cat.nombre } });
  }

  editar(video: videoMod): void {
    const cat = this.categoria();
    if (!cat) {
      return;
    }
    this.bottomSheet.open(VideoFormSheetComponent, {
      data: { categoriaNombre: cat.nombre, video }
    });
  }

  eliminar(video: videoMod): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '340px',
        data: {
          titulo: 'Eliminar video',
          mensaje: `¿Eliminar "${video.titulo}"? Esta acción no se puede deshacer.`
        }
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.adminData.eliminarVideo(video.id);
        }
      });
  }
}
