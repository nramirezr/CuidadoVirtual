import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BienvenidaComponent } from './bienvenida.component';
import { VisitCounterService } from '../../services/visit-counter.service';

describe('BienvenidaComponent', () => {
  let fixture: ComponentFixture<BienvenidaComponent>;
  let component: BienvenidaComponent;
  let visitCounterServiceSpy: jasmine.SpyObj<VisitCounterService>;

  beforeEach(async () => {
    visitCounterServiceSpy = jasmine.createSpyObj('VisitCounterService', ['getVisitCount']);
    visitCounterServiceSpy.getVisitCount.and.returnValue(of({ count: 5 }));

    await TestBed.configureTestingModule({
      imports: [BienvenidaComponent],
      providers: [
        { provide: VisitCounterService, useValue: visitCounterServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BienvenidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the welcome title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.asistente-title')?.textContent)
      .toContain('¡Bienvenido/a al Asistente para Cuidadores del Hospital Félix Bulnes!');
  });

  it('should display the visit count', () => {
    expect(component.visitCount).toEqual(5);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.legal-line')?.textContent).toContain('visitas: 5');
  });

  it('should send the user to the category selector, not straight to the feed', () => {
    // El CTA es un <button mat-flat-button routerLink>, no un <a>, así que se
    // verifica el destino disparando el click real y observando la navegación.
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    const cta = fixture.nativeElement.querySelector('.go-to-videos') as HTMLButtonElement;
    cta.click();

    expect(router.navigateByUrl).toHaveBeenCalled();
    const urlTree = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0];
    expect(router.serializeUrl(urlTree)).toBe('/categorias');
  });
});
