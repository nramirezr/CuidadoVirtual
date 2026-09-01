import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminVideosComponent } from './admin-videos.component';
import { CategoriesService } from '../../../services/categories.service';
import { VideosService } from '../../../services/videos.service';
import { CategoriaDoc } from '../../../models/categoria-doc.model';
import { VideoDoc } from '../../../models/video-doc.model';

function video(id: string): VideoDoc {
  return {
    id,
    categoriaId: 'cat-1',
    categoria: 'Anticoagulante',
    titulo: `Video ${id}`,
    descripcion: '',
    fuente: 'youtube',
    youtubeId: 'abc',
    orden: 0,
    activo: true,
    createdBy: null
  };
}

describe('AdminVideosComponent', () => {
  let fixture: ComponentFixture<AdminVideosComponent>;
  let component: AdminVideosComponent;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let videosServiceSpy: jasmine.SpyObj<VideosService>;

  const categoriaFake: CategoriaDoc = {
    id: 'cat-1',
    nombre: 'Anticoagulante',
    icono: '🩸',
    slug: 'anticoagulante',
    orden: 0,
    activa: true
  };

  beforeEach(async () => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['categoriasLive']);
    videosServiceSpy = jasmine.createSpyObj('VideosService', [
      'videosDeCategoriaLive',
      'eliminarVideo'
    ]);
    categoriesServiceSpy.categoriasLive.and.returnValue(of([categoriaFake]));
    videosServiceSpy.videosDeCategoriaLive.and.returnValue(of([video('v1'), video('v2')]));

    await TestBed.configureTestingModule({
      imports: [AdminVideosComponent],
      providers: [
        provideRouter([]),
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: VideosService, useValue: videosServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminVideosComponent);
    component = fixture.componentInstance;
  });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    expect(component).toBeTruthy();
  }));

  it('should list the videos belonging to the given category id', fakeAsync(() => {
    fixture.componentRef.setInput('categoriaId', 'cat-1');
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(videosServiceSpy.videosDeCategoriaLive).toHaveBeenCalledWith('cat-1');
    const rows = fixture.nativeElement.querySelectorAll('.video-row');
    expect(rows.length).toBe(2);
  }));

  it('should show an empty message for a category with no videos', fakeAsync(() => {
    videosServiceSpy.videosDeCategoriaLive.and.returnValue(of([]));
    fixture.componentRef.setInput('categoriaId', 'cat-1');
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty')).toBeTruthy();
  }));

  it('should call eliminarVideo on the service', async () => {
    videosServiceSpy.eliminarVideo.and.returnValue(Promise.resolve());

    await videosServiceSpy.eliminarVideo('v1');

    expect(videosServiceSpy.eliminarVideo).toHaveBeenCalledWith('v1');
  });
});
