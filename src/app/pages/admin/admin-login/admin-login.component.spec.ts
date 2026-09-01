import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FirebaseError } from 'firebase/app';
import { AdminLoginComponent } from './admin-login.component';
import { AuthService } from '../../../services/auth.service';

describe('AdminLoginComponent', () => {
  let fixture: ComponentFixture<AdminLoginComponent>;
  let component: AdminLoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'logout',
      'waitUntilReady',
      'isAdmin'
    ]);
    authServiceSpy.waitUntilReady.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /admin/categorias on successful admin login', async () => {
    authServiceSpy.login.and.returnValue(Promise.resolve({} as never));
    authServiceSpy.isAdmin.and.returnValue(true);

    component.form.setValue({ email: 'admin@cuidadovirtual.cl', password: 'secreto123' });
    await component.ingresar();

    expect(authServiceSpy.login).toHaveBeenCalledWith('admin@cuidadovirtual.cl', 'secreto123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/categorias');
    expect(component.errorMsg()).toBeNull();
  });

  it('should log out and show an error when the account is not an admin', async () => {
    authServiceSpy.login.and.returnValue(Promise.resolve({} as never));
    authServiceSpy.isAdmin.and.returnValue(false);
    authServiceSpy.logout.and.returnValue(Promise.resolve());

    component.form.setValue({ email: 'nobody@cuidadovirtual.cl', password: 'secreto123' });
    await component.ingresar();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.errorMsg()).toContain('no tiene permisos');
  });

  it('should show a generic error on invalid credentials, without distinguishing the cause', async () => {
    authServiceSpy.login.and.returnValue(
      Promise.reject(new FirebaseError('auth/invalid-credential', 'invalid'))
    );

    component.form.setValue({ email: 'admin@cuidadovirtual.cl', password: 'incorrecta' });
    await component.ingresar();

    expect(component.errorMsg()).toBe('Correo o contraseña incorrectos.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should not submit an invalid form', async () => {
    component.form.setValue({ email: 'no-es-un-correo', password: '' });
    await component.ingresar();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });
});
