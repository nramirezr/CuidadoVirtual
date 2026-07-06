import { TestBed } from '@angular/core/testing';
import { ReelsAudioStateService } from './reels-audio-state.service';

describe('ReelsAudioStateService', () => {
  let service: ReelsAudioStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReelsAudioStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start muted by default', () => {
    expect(service.muted()).toBeTrue();
  });

  it('should flip the muted state on toggle', () => {
    service.toggle();
    expect(service.muted()).toBeFalse();

    service.toggle();
    expect(service.muted()).toBeTrue();
  });
});
