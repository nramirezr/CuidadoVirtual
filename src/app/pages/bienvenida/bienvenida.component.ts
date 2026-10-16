import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VisitCounterService } from '../../services/visit-counter.service';
import { ReelsPlayerPoolService } from '../../services/reels-player-pool.service';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './bienvenida.component.html',
  styleUrl: './bienvenida.component.css'
})
export class BienvenidaComponent implements OnInit {
  logoSrc = 'assets/logo.jpg';
  logoUssSrc = 'assets/logo-uss-vm.jpg';
  visitCount = 0;

  constructor(
    private visitCounterService: VisitCounterService,
    private pool: ReelsPlayerPoolService
  ) {}

  ngOnInit(): void {
    // Se crean los reproductores de YouTube desde ya: cuando la persona toque una
    // categoría deben existir para poder desbloquear el sonido en ese toque.
    this.pool.asegurar();
    this.visitCounterService.getVisitCount().subscribe((data) => {
      if (data && typeof data.count === 'number') {
        this.visitCount = data.count;
      }
    });
  }
}
