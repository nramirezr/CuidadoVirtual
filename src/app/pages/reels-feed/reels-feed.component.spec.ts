import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReelsFeedComponent } from './reels-feed.component';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { videos } from '../../data/videos';
import { videoMod } from '../../models/videoMod.model';

@Component({
  selector: 'app-reel-card',
  standalone: true,
  template: '<div class="stub-reel-card">{{ video?.titulo }}</div>'
})
class StubReelCardComponent {
  @Input() video?: videoMod;
}

describe('ReelsFeedComponent', () => {
  let fixture: ComponentFixture<ReelsFeedComponent>;
  let component: ReelsFeedComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReelsFeedComponent],
      providers: [provideRouter([])]
    })
      .overrideComponent(ReelsFeedComponent, {
        remove: { imports: [ReelCardComponent] },
        add: { imports: [StubReelCardComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReelsFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show every video by default ("Todos")', () => {
    expect(component.categoriaSeleccionada()).toBeNull();
    expect(component.videosFiltrados().length).toBe(videos.length);

    const cards = fixture.nativeElement.querySelectorAll('app-reel-card');
    expect(cards.length).toBe(videos.length);
  });

  it('should narrow the feed to a single category when a chip is selected', () => {
    component.seleccionarCategoria('Anticoagulante');
    fixture.detectChanges();

    const filtered = component.videosFiltrados();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((v) => v.categoria === 'Anticoagulante')).toBeTrue();
  });

  it('should restore the full list when "Todos" is selected again', () => {
    component.seleccionarCategoria('Anticoagulante');
    fixture.detectChanges();

    component.seleccionarCategoria(null);
    fixture.detectChanges();

    expect(component.videosFiltrados().length).toBe(videos.length);
  });
});
