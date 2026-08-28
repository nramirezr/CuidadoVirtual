import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReelsFeedComponent } from './reels-feed.component';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { videoMod } from '../../models/videoMod.model';
import { slugify } from '../../utils/slug.util';

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
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show an empty state when no category slug is set', () => {
    fixture.detectChanges();

    expect(component.categoriaActual()).toBeNull();
    expect(component.videosFiltrados().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('should filter the feed to the category matching the slug input', () => {
    fixture.componentRef.setInput('categoriaSlug', slugify('Anticoagulante'));
    fixture.detectChanges();

    const filtered = component.videosFiltrados();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((v) => v.categoria === 'Anticoagulante')).toBeTrue();

    const cards = fixture.nativeElement.querySelectorAll('app-reel-card');
    expect(cards.length).toBe(filtered.length);
  });

  it('should show an empty state for an unknown slug', () => {
    fixture.componentRef.setInput('categoriaSlug', 'categoria-inexistente');
    fixture.detectChanges();

    expect(component.categoriaActual()).toBeNull();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('should have a back button linking to /categorias', () => {
    fixture.detectChanges();

    const backLink = fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/categorias');
  });
});
