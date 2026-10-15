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

  it('should start with sound when the user has already interacted with the page', () => {
    Object.defineProperty(navigator, 'userActivation', {
      value: { hasBeenActive: true },
      configurable: true
    });
    try {
      expect(new ReelsAudioStateService().muted()).toBeFalse();
    } finally {
      delete (navigator as unknown as Record<string, unknown>)['userActivation'];
    }
  });

  it('should always start muted on iPhone, where the first video cannot autoplay with sound', () => {
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true }, configurable: true });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
      configurable: true
    });
    try {
      expect(new ReelsAudioStateService().muted()).toBeTrue();
    } finally {
      delete (navigator as unknown as Record<string, unknown>)['userActivation'];
      delete (navigator as unknown as Record<string, unknown>)['userAgent'];
    }
  });

  it('should flip the muted state on toggle', () => {
    service.toggle();
    expect(service.muted()).toBeFalse();

    service.toggle();
    expect(service.muted()).toBeTrue();
  });
});
