import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReelsFeedComponent } from './reels-feed.component';
import { ReelCardComponent } from '../../components/reel-card/reel-card.component';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { CategoriaDoc } from '../../models/categoria-doc.model';
import { VideoDoc } from '../../models/video-doc.model';
import { videoMod } from '../../models/videoMod.model';

@Component({
  selector: 'app-reel-card',
  standalone: true,
  template: '<div class="stub-reel-card">{{ video?.titulo }}</div>'
})
class StubReelCardComponent {
  @Input() video?: videoMod;
}

const CATEGORIA_ANTICOAGULANTE: CategoriaDoc = {
  id: 'cat-1',
  nombre: 'Anticoagulante',
  icono: '🩸',
  slug: 'anticoagulante',
  orden: 0,
  activa: true
};

function video(id: string, categoria: string): VideoDoc {
  return {
    id,
    categoriaId: 'cat-1',
    categoria,
    titulo: `Video ${id}`,
    descripcion: '',
    fuente: 'youtube',
    youtubeId: 'abc',
    orden: 0,
    activo: true,
    createdBy: null
  };
}

describe('ReelsFeedComponent', () => {
  let fixture: ComponentFixture<ReelsFeedComponent>;
  let component: ReelsFeedComponent;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let videosServiceSpy: jasmine.SpyObj<VideosService>;

  beforeEach(async () => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['findBySlug']);
    videosServiceSpy = jasmine.createSpyObj('VideosService', [
      'videosOneShot',
      'videosDeCategoriaOneShot'
    ]);
    videosServiceSpy.videosOneShot.and.returnValue(
      Promise.resolve([video('v1', 'Anticoagulante'), video('v2', 'Otra')])
    );

    await TestBed.configureTestingModule({
      imports: [ReelsFeedComponent],
      providers: [
        provideRouter([]),
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: VideosService, useValue: videosServiceSpy }
      ]
    })
      .overrideComponent(ReelsFeedComponent, {
        remove: { imports: [ReelCardComponent] },
        add: { imports: [StubReelCardComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReelsFeedComponent);
    component = fixture.componentInstance;
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await settle();
    expect(component).toBeTruthy();
  });

  it('should show every video ("Ver todos") when no category slug is set', async () => {
    await settle();

    expect(component.modoTodos()).toBeTrue();
    expect(component.categoriaActual()).toBeNull();
    expect(component.videosFiltrados().length).toBe(2);

    const cards = fixture.nativeElement.querySelectorAll('app-reel-card');
    expect(cards.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeFalsy();
  });

  it('should filter the feed to the category matching the slug input', async () => {
    categoriesServiceSpy.findBySlug.and.returnValue(Promise.resolve(CATEGORIA_ANTICOAGULANTE));
    videosServiceSpy.videosDeCategoriaOneShot.and.returnValue(
      Promise.resolve([video('v1', 'Anticoagulante')])
    );

    fixture.componentRef.setInput('categoriaSlug', 'anticoagulante');
    await settle();

    expect(categoriesServiceSpy.findBySlug).toHaveBeenCalledWith('anticoagulante');
    expect(videosServiceSpy.videosDeCategoriaOneShot).toHaveBeenCalledWith('cat-1');

    const cards = fixture.nativeElement.querySelectorAll('app-reel-card');
    expect(cards.length).toBe(1);
  });

  it('should show an empty state for an unknown slug (not the "Ver todos" state)', async () => {
    categoriesServiceSpy.findBySlug.and.returnValue(Promise.resolve(null));

    fixture.componentRef.setInput('categoriaSlug', 'categoria-inexistente');
    await settle();

    expect(component.modoTodos()).toBeFalse();
    expect(component.categoriaActual()).toBeNull();
    expect(component.categoriaNoEncontrada()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('should have a back button linking to /categorias', async () => {
    await settle();

    const backLink = fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/categorias');
  });
});
