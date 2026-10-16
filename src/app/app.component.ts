import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AgeConfirmationDialogComponent } from './dialogs/age-confirmation-dialog/age-confirmation-dialog.component';
import { VisitCounterService } from './services/visit-counter.service';
import { ReelsPlayerPoolService } from './services/reels-player-pool.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'asistmedic';

  @ViewChild('capaReproductores', { static: true }) capaReproductores!: ElementRef<HTMLElement>;

  constructor(
    public dialog: MatDialog,
    private visitCounterService: VisitCounterService,
    private pool: ReelsPlayerPoolService
  ) { }

  ngAfterViewInit(): void {
    this.pool.registrarCapa(this.capaReproductores.nativeElement);
  }

  ngOnInit() {
    // Incrementar la visita al cargar la aplicación
    this.visitCounterService.incrementVisit().subscribe();
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

