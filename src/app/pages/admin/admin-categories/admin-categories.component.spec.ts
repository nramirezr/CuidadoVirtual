import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminCategoriesComponent } from './admin-categories.component';
import { AdminMockDataService } from '../../../services/admin-mock-data.service';

describe('AdminCategoriesComponent', () => {
  let fixture: ComponentFixture<AdminCategoriesComponent>;
  let component: AdminCategoriesComponent;
  let adminData: AdminMockDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesComponent, NoopAnimationsModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesComponent);
    component = fixture.componentInstance;
    adminData = TestBed.inject(AdminMockDataService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list the seeded mock categories with video counts', () => {
    const rows = fixture.nativeElement.querySelectorAll('.category-row');
    expect(rows.length).toBe(adminData.categorias().length);
  });

  it('should remove a category from the mock state on eliminarCategoria', () => {
    const before = adminData.categorias().length;
    const id = adminData.categorias()[0].id;

    adminData.eliminarCategoria(id);

    expect(adminData.categorias().length).toBe(before - 1);
  });
});
