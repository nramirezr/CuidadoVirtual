import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReelsAudioStateService {
  /**
   * Los navegadores solo permiten reproducir con sonido si la persona ya
   * interactuó con la página (en este flujo, al elegir una categoría o
   * aceptar la mayoría de edad). Si ya hubo interacción se parte con sonido;
   * si no (p. ej. entrada directa por URL) se parte en silencio para que el
   * autoplay no sea bloqueado.
   *
   * En iPhone/iPad el primer video nunca arranca solo con sonido (Safari lo
   * bloquea aunque haya habido toques previos; verificado en simulador), así
   * que ahí se parte en silencio. Cuando la persona toca el botón de sonido,
   * Safari desbloquea el audio y los videos siguientes sí arrancan con sonido.
   */
  readonly muted = signal<boolean>(!ReelsAudioStateService.yaHuboInteraccion());

  toggle(): void {
    this.muted.set(!this.muted());
  }

  private static yaHuboInteraccion(): boolean {
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
      | (Navigator & { userActivation?: { hasBeenActive: boolean } })
      | undefined;
    if (!nav || ReelsAudioStateService.esIos(nav)) {
      return false;
    }
    return nav.userActivation?.hasBeenActive === true;
  }

  private static esIos(nav: Navigator): boolean {
    return (
      /iPad|iPhone|iPod/.test(nav.userAgent) ||
      (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
    );
  }
}
