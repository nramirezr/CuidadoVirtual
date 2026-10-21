import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AgeConfirmationDialogComponent } from './dialogs/age-confirmation-dialog/age-confirmation-dialog.component';
import { VisitCounterService } from './services/visit-counter.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'asistmedic';

  constructor(
    public dialog: MatDialog,
    private visitCounterService: VisitCounterService,
    private router: Router
  ) { }

  ngOnInit() {
    // Incrementar la visita al cargar la aplicación
    this.visitCounterService.incrementVisit().subscribe();

    // La portada ('/') solo sirve para elegir entre la versión 2025 (sitio
    // anterior) y la 2026: la declaración de mayoría de edad se pide al entrar a
    // esta versión (cualquier otra ruta, incluso si se llega directo por URL).
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        filter((e) => e.urlAfterRedirects.split(/[?#]/)[0] !== '/'),
        take(1)
      )
      .subscribe(() => this.openAgeConfirmationDialog());
  }
  openAgeConfirmationDialog(): void {
    const dialogRef = this.dialog.open(AgeConfirmationDialogComponent, {
      width: '480px', // Un ancho adecuado para la tarjeta
      disableClose: true,
      panelClass: 'age-confirmation-dialog-panel' // Clase para estilos globales del contenedor del diálogo
    });
  }
}

