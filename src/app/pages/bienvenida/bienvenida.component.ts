import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VisitCounterService } from '../../services/visit-counter.service';

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

  constructor(private visitCounterService: VisitCounterService) {}

  ngOnInit(): void {
    this.visitCounterService.getVisitCount().subscribe((data) => {
      if (data && typeof data.count === 'number') {
        this.visitCount = data.count;
      }
    });
  }
}
