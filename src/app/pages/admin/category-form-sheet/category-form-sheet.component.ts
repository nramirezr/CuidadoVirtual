import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';
import { slugify } from '../../../utils/slug.util';

export interface CategoryFormSheetData {
  id?: string;
  nombre?: string;
  icono?: string;
}

@Component({
  selector: 'app-category-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './category-form-sheet.component.html',
  styleUrl: './category-form-sheet.component.css'
})
export class CategoryFormSheetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminData = inject(AdminMockDataService);
  private readonly sheetRef = inject(MatBottomSheetRef<CategoryFormSheetComponent>);
  private readonly data = inject<CategoryFormSheetData>(MAT_BOTTOM_SHEET_DATA, { optional: true });

  readonly esEdicion = !!this.data?.id;

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
    icono: [this.data?.icono ?? '', [Validators.required]]
  });

  get urlPreview(): string {
    const nombre = this.form.controls.nombre.value;
    return `/videos/${nombre ? slugify(nombre) : '…'}`;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (this.esEdicion && this.data?.id) {
      this.adminData.actualizarCategoria(this.data.id, valores);
    } else {
      this.adminData.agregarCategoria(valores);
    }
    this.sheetRef.dismiss();
  }

  cancelar(): void {
    this.sheetRef.dismiss();
  }
}
