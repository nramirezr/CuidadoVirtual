import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CategoriesService } from '../../../services/categories.service';
import { ConfirmDialogComponent } from '../../../dialogs/confirm-dialog/confirm-dialog.component';
import { CategoryFormSheetComponent } from '../category-form-sheet/category-form-sheet.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [RouterLink, CdkDropList, CdkDrag],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css'
})
export class AdminCategoriesComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly categorias = toSignal(this.categoriesService.categoriasConConteoLive(), {
    initialValue: []
  });

  async drop(event: CdkDragDrop<unknown>): Promise<void> {
    const ids = this.categorias().map((c) => c.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    await this.categoriesService.reordenarCategorias(ids);
  }

  agregar(): void {
    this.bottomSheet.open(CategoryFormSheetComponent);
  }

  editar(id: string, nombre: string, icono: string, activa: boolean): void {
    this.bottomSheet.open(CategoryFormSheetComponent, { data: { id, nombre, icono, activa } });
  }

  eliminar(id: string, nombre: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '340px',
        data: {
          titulo: 'Eliminar categoría',
          mensaje: `¿Eliminar "${nombre}" y todos sus videos? Esta acción no se puede deshacer.`
        }
      })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (confirmado) {
          await this.categoriesService.eliminarCategoria(id);
        }
      });
  }
}
