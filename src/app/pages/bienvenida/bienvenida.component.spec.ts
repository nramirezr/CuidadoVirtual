import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
