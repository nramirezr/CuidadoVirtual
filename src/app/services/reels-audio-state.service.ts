import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReelsAudioStateService {
  /**
   * Los navegadores solo permiten reproducir con sonido si la persona ya
   * interactuó con la página (en este flujo, al elegir una categoría o
   * aceptar la mayoría de edad). Si ya hubo interacción se parte con sonido;
   * si no (p. ej. entrada directa por URL) se parte en silencio para que el
   * autoplay no sea bloqueado.
   */
  readonly muted = signal<boolean>(!ReelsAudioStateService.yaHuboInteraccion());

  toggle(): void {
    this.muted.set(!this.muted());
  }

  private static yaHuboInteraccion(): boolean {
    const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
      | (Navigator & { userActivation?: { hasBeenActive: boolean } })
      | undefined;
    return nav?.userActivation?.hasBeenActive === true;
  }
}
