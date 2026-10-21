import { routes } from './app.routes';
import { InicioComponent } from './pages/inicio/inicio.component';
import { BienvenidaComponent } from './pages/bienvenida/bienvenida.component';

describe('app routes', () => {
  const ruta = (path: string) => routes.find((r) => r.path === path);

  it('should open the version picker at the root', () => {
    expect(ruta('')?.component).toBe(InicioComponent);
  });

  it('should keep the welcome page of this version at /bienvenida', () => {
    expect(ruta('bienvenida')?.component).toBe(BienvenidaComponent);
  });

  it('should keep the old /inicio link working by pointing it to the welcome page', () => {
    expect(ruta('inicio')?.redirectTo).toBe('bienvenida');
  });

  it('should still send unknown URLs to the root', () => {
    expect(ruta('**')?.redirectTo).toBe('');
  });
});
