import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';
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
  private readonly adminData = inject(AdminMockDataService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly categorias = this.adminData.categoriasConConteo;

  drop(event: CdkDragDrop<unknown>): void {
    const ids = this.categorias().map((c) => c.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.adminData.reordenarCategorias(ids);
  }

  agregar(): void {
    this.bottomSheet.open(CategoryFormSheetComponent);
  }

  editar(id: string, nombre: string, icono: string): void {
    this.bottomSheet.open(CategoryFormSheetComponent, { data: { id, nombre, icono } });
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
      .subscribe((confirmado) => {
        if (confirmado) {
          this.adminData.eliminarCategoria(id);
        }
      });
  }
}
