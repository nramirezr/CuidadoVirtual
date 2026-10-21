import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
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
    private pool: ReelsPlayerPoolService,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    this.pool.registrarCapa(this.capaReproductores.nativeElement);
  }

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

