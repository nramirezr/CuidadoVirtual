import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReelsAudioStateService {
  readonly muted = signal<boolean>(true);

  toggle(): void {
    this.muted.set(!this.muted());
  }
}
