import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { VisitCounterService } from './services/visit-counter.service';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let visitCounterServiceSpy: jasmine.SpyObj<VisitCounterService>;

  beforeEach(async () => {
    visitCounterServiceSpy = jasmine.createSpyObj('VisitCounterService', ['incrementVisit', 'getVisitCount']);
    visitCounterServiceSpy.incrementVisit.and.returnValue(of(null));
    visitCounterServiceSpy.getVisitCount.and.returnValue(of({ count: 5 }));

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        { provide: VisitCounterService, useValue: visitCounterServiceSpy },
        provideRouter(routes)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
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
    expect(component.title).toEqual('asistmedic');
  });

  describe('age confirmation dialog', () => {
    let router: Router;

    beforeEach(() => {
      router = TestBed.inject(Router);
      spyOn(component.dialog, 'open');
    });

    it('should NOT be asked on the version picker (root)', async () => {
      await router.navigateByUrl('/');
      expect(component.dialog.open).not.toHaveBeenCalled();
    });

    it('should be asked once when entering this version from the picker', async () => {
      await router.navigateByUrl('/');
      await router.navigateByUrl('/bienvenida');
      await router.navigateByUrl('/');
      await router.navigateByUrl('/bienvenida');
      expect(component.dialog.open).toHaveBeenCalledTimes(1);
    });

    it('should scroll to the top before opening the dialog (it freezes the scroll where it is)', async () => {
      const scroll = spyOn(window, 'scrollTo');
      scroll.and.callFake(() => expect(component.dialog.open).not.toHaveBeenCalled());
      await router.navigateByUrl('/bienvenida');
      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('should be asked when the person lands directly on an inner page (shared link / QR)', async () => {
      await router.navigateByUrl('/bienvenida');
      expect(component.dialog.open).toHaveBeenCalledTimes(1);
    });
  });

  it('should call incrementVisit on initialization', () => {
    expect(visitCounterServiceSpy.incrementVisit).toHaveBeenCalledTimes(1);
  });
});
