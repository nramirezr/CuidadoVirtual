import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';
import { FuenteVideo, videoMod } from '../../../models/videoMod.model';

export interface VideoFormSheetData {
  categoriaNombre: string;
  video?: videoMod;
}

@Component({
  selector: 'app-video-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './video-form-sheet.component.html',
  styleUrl: './video-form-sheet.component.css'
})
export class VideoFormSheetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminData = inject(AdminMockDataService);
  private readonly sheetRef = inject(MatBottomSheetRef<VideoFormSheetComponent>);
  private readonly data = inject<VideoFormSheetData>(MAT_BOTTOM_SHEET_DATA);

  readonly esEdicion = !!this.data.video;

  readonly form = this.fb.nonNullable.group({
    titulo: [this.data.video?.titulo ?? '', [Validators.required, Validators.minLength(3)]],
    descripcion: [this.data.video?.descripcion ?? ''],
    fuente: [this.data.video?.fuente ?? ('youtube' as FuenteVideo), [Validators.required]],
    youtubeId: [this.data.video?.youtubeId ?? ''],
    mp4Url: [this.data.video?.mp4Url ?? ''],
    posterUrl: [this.data.video?.posterUrl ?? '']
  });

  get esYoutube(): boolean {
    return this.form.controls.fuente.value === 'youtube';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { titulo, descripcion, fuente, youtubeId, mp4Url, posterUrl } = this.form.getRawValue();
    const payload = {
      titulo,
      descripcion,
      fuente,
      youtubeId: fuente === 'youtube' ? youtubeId : undefined,
      mp4Url: fuente === 'mp4' ? mp4Url : undefined,
      posterUrl: posterUrl || undefined
    };

    if (this.esEdicion && this.data.video) {
      this.adminData.actualizarVideo(this.data.video.id, payload);
    } else {
      this.adminData.agregarVideo(this.data.categoriaNombre, payload);
    }
    this.sheetRef.dismiss();
  }

  cancelar(): void {
    this.sheetRef.dismiss();
  }
}
