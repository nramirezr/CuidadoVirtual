import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoriesService } from '../../../services/categories.service';
import { slugify } from '../../../utils/slug.util';

export interface CategoryFormSheetData {
  id?: string;
  nombre?: string;
  icono?: string;
  activa?: boolean;
}

@Component({
  selector: 'app-category-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './category-form-sheet.component.html',
  styleUrl: './category-form-sheet.component.css'
})
export class CategoryFormSheetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly sheetRef = inject(MatBottomSheetRef<CategoryFormSheetComponent>);
  private readonly data = inject<CategoryFormSheetData>(MAT_BOTTOM_SHEET_DATA, { optional: true });

  readonly esEdicion = !!this.data?.id;
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
    icono: [this.data?.icono ?? '', [Validators.required]],
    activa: [this.data?.activa ?? true]
  });

  get urlPreview(): string {
    const nombre = this.form.controls.nombre.value;
    return `/videos/${nombre ? slugify(nombre) : '…'}`;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMsg.set(null);
    this.guardando.set(true);
    const valores = this.form.getRawValue();

    try {
      if (this.esEdicion && this.data?.id) {
        await this.categoriesService.actualizarCategoria(this.data.id, valores);
      } else {
        await this.categoriesService.agregarCategoria(valores);
      }
      this.sheetRef.dismiss();
    } catch {
      this.errorMsg.set('No se pudo guardar la categoría. Intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  cancelar(): void {
    this.sheetRef.dismiss();
  }
}
