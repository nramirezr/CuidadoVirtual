import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { AgeConfirmationDialogComponent } from './dialogs/age-confirmation-dialog/age-confirmation-dialog.component';
import { VisitCounterService } from './services/visit-counter.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatCardModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'asistmedic';
  logoSrc: string = 'assets/logo.jpg';
  logoUssSrc: string = 'assets/logo-uss-vm.jpg';
  visitCount: number = 0;

  constructor(public dialog: MatDialog, private visitCounterService: VisitCounterService) { }

  ngOnInit() {
    // Incrementar la visita al cargar la aplicación
    this.visitCounterService.incrementVisit().subscribe();

    // Obtener el contador de visitas para mostrarlo
    this.visitCounterService.getVisitCount().subscribe(data => {
      if (data && typeof data.count === 'number') {
        this.visitCount = data.count;
      }
    });
    this.openAgeConfirmationDialog();
  }
  openAgeConfirmationDialog(): void {
    const dialogRef = this.dialog.open(AgeConfirmationDialogComponent, {
      width: '480px', // Un ancho adecuado para la tarjeta
      disableClose: true,
      panelClass: 'age-confirmation-dialog-panel' // Clase para estilos globales del contenedor del diálogo
    });
  }
}

