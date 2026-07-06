import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReelCardComponent } from './reel-card.component';
import { YoutubeApiLoaderService } from '../../services/youtube-api-loader.service';
import { videoMod } from '../../models/videoMod.model';

class FakeYTPlayer {
  static instances: FakeYTPlayer[] = [];
  playVideo = jasmine.createSpy('playVideo');
  pauseVideo = jasmine.createSpy('pauseVideo');
  mute = jasmine.createSpy('mute');
  unMute = jasmine.createSpy('unMute');
  destroy = jasmine.createSpy('destroy');

  constructor(public elementId: string, public options: any) {
    FakeYTPlayer.instances.push(this);
    options.events?.onReady?.({ target: this });
  }
}

describe('ReelCardComponent', () => {
  let fixture: ComponentFixture<ReelCardComponent>;
  let component: ReelCardComponent;
  let observeSpy: jasmine.Spy;
  let intersectionCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

  const youtubeVideo: videoMod = {
    id: 'test-yt',
    categoria: 'Anticoagulante',
    titulo: 'Video de prueba',
    descripcion: 'Descripción de prueba',
    fuente: 'youtube',
    youtubeId: 'abc123'
  };

  const mp4Video: videoMod = {
    id: 'test-mp4',
    categoria: 'Gastrostomía',
    titulo: 'Video mp4 de prueba',
    descripcion: 'Descripción mp4',
    fuente: 'mp4',
    mp4Url: '/assets/videos/demo.mp4'
  };

  beforeEach(async () => {
    (window as any).YT = { Player: FakeYTPlayer };
    FakeYTPlayer.instances = [];

    observeSpy = jasmine.createSpy('observe');
    spyOn(window as any, 'IntersectionObserver').and.callFake(function (callback: any) {
      intersectionCallback = callback;
      return { observe: observeSpy, disconnect: jasmine.createSpy('disconnect') };
    });

    await TestBed.configureTestingModule({
      imports: [ReelCardComponent],
      providers: [
        {
          provide: YoutubeApiLoaderService,
          useValue: { load: () => Promise.resolve() }
        }
      ]
    }).compileComponents();
  });

  function createComponent(video: videoMod): void {
    fixture = TestBed.createComponent(ReelCardComponent);
    component = fixture.componentInstance;
    component.video = video;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent(mp4Video);
    expect(component).toBeTruthy();
  });

  it('should render a youtube target for youtube-sourced videos', async () => {
    createComponent(youtubeVideo);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.youtube-wrapper')).toBeTruthy();
    expect(el.querySelector('video.mp4-video')).toBeFalsy();
  });

  it('should render a video tag for mp4-sourced videos', () => {
    createComponent(mp4Video);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('video.mp4-video')).toBeTruthy();
    expect(el.querySelector('.youtube-wrapper')).toBeFalsy();
  });

  it('should toggle the shared mute state when the mute button is clicked', () => {
    createComponent(mp4Video);
    expect(component.audioState.muted()).toBeTrue();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.mute-button');
    button.click();

    expect(component.audioState.muted()).toBeFalse();
  });

  it('should play the youtube player when visible and pause when it leaves view', async () => {
    createComponent(youtubeVideo);
    await fixture.whenStable();

    const player = FakeYTPlayer.instances[0];
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
    expect(player.playVideo).toHaveBeenCalled();

    intersectionCallback([{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry]);
    expect(player.pauseVideo).toHaveBeenCalled();
  });
});
