import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategorySelectorComponent } from './category-selector.component';
import { categorias } from '../../data/categorias';

describe('CategorySelectorComponent', () => {
  let fixture: ComponentFixture<CategorySelectorComponent>;
  let component: CategorySelectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySelectorComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list every category that has at least one video', () => {
    const items = fixture.nativeElement.querySelectorAll('.category-item:not(.todos-item)');
    expect(items.length).toBe(component.categorias.length);
    expect(component.categorias.length).toBeGreaterThan(0);
    expect(component.categorias.length).toBeLessThanOrEqual(categorias.length);
  });

  it('should link each category to its slugified /videos route', () => {
    const first = component.categorias[0];
    const expectedSlug = component.slugFor(first);
    const link = fixture.nativeElement.querySelector(
      '.category-item:not(.todos-item)'
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`/videos/${expectedSlug}`);
  });

  it('should offer a "Ver todos" entry linking to /videos, ahead of the categories', () => {
    const todos = fixture.nativeElement.querySelector('.todos-item') as HTMLAnchorElement;
    expect(todos).toBeTruthy();
    expect(todos.getAttribute('href')).toBe('/videos');
    expect(todos.textContent).toContain('Ver todos');
  });
});
