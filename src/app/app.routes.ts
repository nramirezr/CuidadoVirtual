import { Routes } from '@angular/router';
import { ReelsFeedComponent } from './pages/reels-feed/reels-feed.component';

export const routes: Routes = [
  { path: 'inicio', component: ReelsFeedComponent, title: 'Cuidado Virtual - Videos' },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
