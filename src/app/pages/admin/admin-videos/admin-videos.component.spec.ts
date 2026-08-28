import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminVideosComponent } from './admin-videos.component';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';

describe('AdminVideosComponent', () => {
  let fixture: ComponentFixture<AdminVideosComponent>;
  let component: AdminVideosComponent;
  let adminData: AdminMockDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVideosComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminVideosComponent);
    component = fixture.componentInstance;
    adminData = TestBed.inject(AdminMockDataService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should list the videos belonging to the given category id', () => {
    const primeraCategoria = adminData.categorias()[0];
    fixture.componentRef.setInput('categoriaId', primeraCategoria.id);
    fixture.detectChanges();

    const expected = adminData.videosDeCategoria(primeraCategoria.nombre).length;
    const rows = fixture.nativeElement.querySelectorAll('.video-row');
    expect(rows.length).toBe(expected);
  });

  it('should show an empty message for a category with no videos', () => {
    const primeraCategoria = adminData.categorias()[0];
    adminData.videosDeCategoria(primeraCategoria.nombre).forEach((v) => adminData.eliminarVideo(v.id));

    fixture.componentRef.setInput('categoriaId', primeraCategoria.id);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty')).toBeTruthy();
  });

  it('should remove a video from the mock state on eliminarVideo', () => {
    const primeraCategoria = adminData.categorias()[0];
    const video = adminData.videosDeCategoria(primeraCategoria.nombre)[0];
    const before = adminData.videos().length;

    adminData.eliminarVideo(video.id);

    expect(adminData.videos().length).toBe(before - 1);
  });
});
