import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategorySelectorComponent } from './category-selector.component';
import { CategoriesService } from '../../services/categories.service';
import { VideosService } from '../../services/videos.service';
import { CategoriaDoc } from '../../models/categoria-doc.model';
import { VideoDoc } from '../../models/video-doc.model';

function categoria(id: string, nombre: string, icono: string, slug: string): CategoriaDoc {
  return { id, nombre, icono, slug, orden: 0, activa: true };
}

function video(id: string, categoria: string): VideoDoc {
  return {
    id,
    categoriaId: 'x',
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

describe('CategorySelectorComponent', () => {
  let fixture: ComponentFixture<CategorySelectorComponent>;
  let component: CategorySelectorComponent;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let videosServiceSpy: jasmine.SpyObj<VideosService>;

  const categoriasFake = [
    categoria('1', 'Anticoagulante', '🩸', 'anticoagulante'),
    categoria('2', 'Sin Videos', '❓', 'sin-videos')
  ];
  const videosFake = [video('v1', 'Anticoagulante')];

  beforeEach(async () => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['categoriasOneShot']);
    videosServiceSpy = jasmine.createSpyObj('VideosService', ['videosOneShot']);
    categoriesServiceSpy.categoriasOneShot.and.returnValue(Promise.resolve(categoriasFake));
    videosServiceSpy.videosOneShot.and.returnValue(Promise.resolve(videosFake));

    await TestBed.configureTestingModule({
      imports: [CategorySelectorComponent],
      providers: [
        provideRouter([]),
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: VideosService, useValue: videosServiceSpy }
      ]
    }).compileComponents();
  });

  function crear(): void {
    fixture = TestBed.createComponent(CategorySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  it('should create', fakeAsync(() => {
    crear();
    expect(component).toBeTruthy();
  }));

  it('should list only categories that have at least one video', fakeAsync(() => {
    crear();
    expect(component.categorias().length).toBe(1);
    expect(component.categorias()[0].nombre).toBe('Anticoagulante');

    const items = fixture.nativeElement.querySelectorAll('.category-item:not(.todos-item)');
    expect(items.length).toBe(1);
  }));

  it('should link each category to its slug-based /videos route', fakeAsync(() => {
    crear();
    const link = fixture.nativeElement.querySelector(
      '.category-item:not(.todos-item)'
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/videos/anticoagulante');
  }));

  it('should offer a "Ver todos" entry linking to /videos', fakeAsync(() => {
    crear();
    const todos = fixture.nativeElement.querySelector('.todos-item') as HTMLAnchorElement;
    expect(todos).toBeTruthy();
    expect(todos.getAttribute('href')).toBe('/videos');
  }));

  it('should show an error message if loading fails', fakeAsync(() => {
    categoriesServiceSpy.categoriasOneShot.and.returnValue(Promise.reject('boom'));
    crear();

    expect(fixture.nativeElement.querySelector('.status-msg')).toBeTruthy();
  }));
});
