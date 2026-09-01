import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AdminCategoriesComponent } from './admin-categories.component';
import { CategoriesService } from '../../../services/categories.service';

describe('AdminCategoriesComponent', () => {
  let fixture: ComponentFixture<AdminCategoriesComponent>;
  let component: AdminCategoriesComponent;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;

  const categoriasFake = [
    { id: '1', nombre: 'Anticoagulante', icono: '🩸', slug: 'anticoagulante', orden: 0, activa: true, videoCount: 2 },
    { id: '2', nombre: 'Gastrostomía', icono: '🍼', slug: 'gastrostomia', orden: 1, activa: true, videoCount: 0 }
  ];

  beforeEach(async () => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', [
      'categoriasConConteoLive',
      'reordenarCategorias',
      'eliminarCategoria'
    ]);
    categoriesServiceSpy.categoriasConConteoLive.and.returnValue(of(categoriasFake));

    await TestBed.configureTestingModule({
      imports: [AdminCategoriesComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CategoriesService, useValue: categoriesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list the categories with their video counts', () => {
    const rows = fixture.nativeElement.querySelectorAll('.category-row');
    expect(rows.length).toBe(categoriasFake.length);
  });

  it('should reorder categories via reordenarCategorias when a drag ends', async () => {
    categoriesServiceSpy.reordenarCategorias.and.returnValue(Promise.resolve());

    await component.drop({ previousIndex: 0, currentIndex: 1 } as never);

    expect(categoriesServiceSpy.reordenarCategorias).toHaveBeenCalledWith(['2', '1']);
  });
});
