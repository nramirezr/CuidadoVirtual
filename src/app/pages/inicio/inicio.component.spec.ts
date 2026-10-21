import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  let fixture: ComponentFixture<InicioComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(InicioComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should show the title and the institutions', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Asistente Virtual para Cuidadores');
    expect(el.querySelector('header p')?.textContent).toContain('Hospital Clínico Félix Bulnes');
  });

  it('should offer exactly the two versions, 2025 first and 2026 second', () => {
    const anios = Array.from(el.querySelectorAll('.year')).map((n) => n.textContent?.trim());
    expect(anios).toEqual(['Versión 2025', 'Versión 2026']);
    expect(el.querySelectorAll('img').length).toBe(2);
  });

  it('should keep sending the 2025 version to the old site, in a new tab', () => {
    const link = el.querySelector('#btn-2025') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://cuidado-virtual.vercel.app/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('should send the 2026 version to this site (its welcome page), inside the same app', () => {
    const link = el.querySelector('#btn-2026') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/bienvenida');
    expect(link.getAttribute('target')).toBeNull();
  });
});
