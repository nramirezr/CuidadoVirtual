import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('should call incrementVisit on initialization', () => {
    expect(visitCounterServiceSpy.incrementVisit).toHaveBeenCalledTimes(1);
  });
});
