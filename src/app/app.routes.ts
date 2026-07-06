import { Routes } from '@angular/router';
import { ReelsFeedComponent } from './pages/reels-feed/reels-feed.component';
import { BienvenidaComponent } from './pages/bienvenida/bienvenida.component';

export const routes: Routes = [
  { path: 'inicio', component: ReelsFeedComponent, title: 'Cuidado Virtual - Videos' },
  { path: 'bienvenida', component: BienvenidaComponent, title: 'Cuidado Virtual - Bienvenida' },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
