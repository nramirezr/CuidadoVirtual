import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { VisitCounterService } from './services/visit-counter.service'; // Importa tu servicio
import { of, throwError } from 'rxjs'; // Importa throwError para simular errores
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Necesario para el contexto de HttpClient
import { CommonModule } from '@angular/common'; // Si tu componente usa ngIf, ngFor, etc.
import { MatCardModule } from '@angular/material/card'; // Importa el módulo de Material Card

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let visitCounterServiceSpy: jasmine.SpyObj<VisitCounterService>;

  beforeEach(async () => {
    visitCounterServiceSpy = jasmine.createSpyObj('VisitCounterService', ['incrementVisit', 'getVisitCount']);
    visitCounterServiceSpy.incrementVisit.and.returnValue(of(null));
    visitCounterServiceSpy.getVisitCount.and.returnValue(of({ count: 5 })); // Mock para el caso de éxito

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        CommonModule,
        MatCardModule // Importa el módulo de Material Card para reconocer <mat-card> y sus sub-componentes
      ],
      providers: [
        { provide: VisitCounterService, useValue: visitCounterServiceSpy },
        provideRouter(routes)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    // La detección de cambios inicial se hace aquí, lo que llamará a ngOnInit y, por tanto, a los métodos del servicio.
    fixture.detectChanges();
  });

  afterEach(() => {
    visitCounterServiceSpy.incrementVisit.calls.reset();
    visitCounterServiceSpy.getVisitCount.calls.reset();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'asistmedic' title`, () => {
    // Asume que tu AppComponent tiene una propiedad 'title' definida como 'asistmedic'
    expect(component.title).toEqual('asistmedic');
  });

  it('should render the welcome title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-card-title.asistente-title')?.textContent)
      .toContain('¡Bienvenido/a al Asistente para Cuidadores del Hospital Félix Bulnes!');
  });


  it('should call incrementVisit on initialization', () => {
    expect(visitCounterServiceSpy.incrementVisit).toHaveBeenCalledTimes(1);
  });

  it('should call getVisitCount on initialization and display the count', () => {
    expect(visitCounterServiceSpy.getVisitCount).toHaveBeenCalledTimes(1);
    expect(component.visitCount).toEqual(5);

    const compiled = fixture.nativeElement as HTMLElement;
    const visitCountParagraph = compiled.querySelector('mat-card-footer .footer-box div p');
    expect(visitCountParagraph?.textContent).toContain('visitas: 5');
  });

  it('should handle error when getting visit count and display 0', async () => {
    visitCounterServiceSpy.getVisitCount.calls.reset();
    visitCounterServiceSpy.incrementVisit.calls.reset(); // También resetear este por si acaso

    visitCounterServiceSpy.getVisitCount.and.returnValue(of({ count: 0 }));

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit con el mock de error

    expect(visitCounterServiceSpy.getVisitCount).toHaveBeenCalledTimes(1); // Esperamos solo una llamada aquí
    expect(component.visitCount).toEqual(0);

    const compiled = fixture.nativeElement as HTMLElement;
    // Selector corregido para el caso de error también
    const visitCountParagraph = compiled.querySelector('mat-card-footer .footer-box div p');
    expect(visitCountParagraph?.textContent).toContain('visitas: 0');
  });
});
