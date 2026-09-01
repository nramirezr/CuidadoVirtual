import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { VideosService } from '../../../services/videos.service';
import { FuenteVideo } from '../../../models/videoMod.model';
import { VideoDoc } from '../../../models/video-doc.model';

export interface VideoFormSheetData {
  categoriaId: string;
  categoriaNombre: string;
  video?: VideoDoc;
}

@Component({
  selector: 'app-video-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './video-form-sheet.component.html',
  styleUrl: './video-form-sheet.component.css'
})
export class VideoFormSheetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly videosService = inject(VideosService);
  private readonly sheetRef = inject(MatBottomSheetRef<VideoFormSheetComponent>);
  private readonly data = inject<VideoFormSheetData>(MAT_BOTTOM_SHEET_DATA);

  readonly esEdicion = !!this.data.video;
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    titulo: [this.data.video?.titulo ?? '', [Validators.required, Validators.minLength(3)]],
    descripcion: [this.data.video?.descripcion ?? ''],
    fuente: [this.data.video?.fuente ?? ('youtube' as FuenteVideo), [Validators.required]],
    youtubeId: [this.data.video?.youtubeId ?? ''],
    mp4Url: [this.data.video?.mp4Url ?? ''],
    posterUrl: [this.data.video?.posterUrl ?? ''],
    activo: [this.data.video?.activo ?? true]
  });

  get esYoutube(): boolean {
    return this.form.controls.fuente.value === 'youtube';
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMsg.set(null);
    this.guardando.set(true);

    const { titulo, descripcion, fuente, youtubeId, mp4Url, posterUrl, activo } =
      this.form.getRawValue();
    const payload = {
      titulo,
      descripcion,
      fuente,
      youtubeId: fuente === 'youtube' ? youtubeId : undefined,
      mp4Url: fuente === 'mp4' ? mp4Url : undefined,
      posterUrl: posterUrl || undefined,
      activo
    };

    try {
      if (this.esEdicion && this.data.video) {
        await this.videosService.actualizarVideo(this.data.video.id, payload);
      } else {
        await this.videosService.agregarVideo(this.data.categoriaId, this.data.categoriaNombre, payload);
      }
      this.sheetRef.dismiss();
    } catch {
      this.errorMsg.set('No se pudo guardar el video. Intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  cancelar(): void {
    this.sheetRef.dismiss();
  }
}
