import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../../services/auth.service';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['waitUntilReady', 'isAdmin']);
    authServiceSpy.waitUntilReady.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    });
  });

  it('should allow activation when the user is an admin', async () => {
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never)
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /admin/login when the user is not an admin', async () => {
    authServiceSpy.isAdmin.and.returnValue(false);
    const router = TestBed.inject(Router);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never)
    );

    expect(router.serializeUrl(result as ReturnType<Router['parseUrl']>)).toBe('/admin/login');
  });
});
