import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
    (window as any).YT = {
      Player: FakeYTPlayer,
      PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }
    };
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

  it('should play as soon as the youtube player is ready, even if the card became visible first (race condition)', async () => {
    // Reproduce el bug real: la tarjeta ya está visible en pantalla mientras el
    // iframe de YouTube todavía está cargando de forma asíncrona (this.ytPlayer
    // aún no existe cuando el IntersectionObserver dispara su callback).
    createComponent(youtubeVideo);
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);

    // Recién ahora se resuelve la carga async del reproductor (onReady se dispara).
    await fixture.whenStable();

    const player = FakeYTPlayer.instances[0];
    expect(player.playVideo).toHaveBeenCalled();
  });

  it('should show a manual play fallback if the video stays visible but never actually starts playing', fakeAsync(() => {
    // Simula lo que reportó un usuario real: el autoplay del iframe de YouTube
    // no arranca (a diferencia de un <video> nativo, no está garantizado en
    // todos los navegadores/redes). onStateChange nunca llega a PLAYING.
    createComponent(youtubeVideo);
    tick();
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
    fixture.detectChanges();

    expect(component.mostrarBotonPlay()).toBeFalse();

    tick(1200);
    fixture.detectChanges();

    expect(component.mostrarBotonPlay()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.play-fallback-button')).toBeTruthy();
  }));

  it('should hide the fallback button once playback actually starts (onStateChange PLAYING)', fakeAsync(() => {
    createComponent(youtubeVideo);
    tick();
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
    fixture.detectChanges();

    const player = FakeYTPlayer.instances[0];
    player.options.events.onStateChange({ data: (window as any).YT.PlayerState.PLAYING });

    tick(1200);
    fixture.detectChanges();

    expect(component.mostrarBotonPlay()).toBeFalse();
  }));

  it('should retry playback when the fallback button is tapped', fakeAsync(() => {
    createComponent(youtubeVideo);
    tick();
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
    fixture.detectChanges();
    tick(1200);
    fixture.detectChanges();

    const player = FakeYTPlayer.instances[0];
    player.playVideo.calls.reset();

    const fallback: HTMLButtonElement = fixture.nativeElement.querySelector('.play-fallback-button');
    fallback.click();

    expect(player.playVideo).toHaveBeenCalled();
  }));

  it('should not show the fallback button after scrolling away before the grace period ends', fakeAsync(() => {
    createComponent(youtubeVideo);
    tick();
    intersectionCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
    fixture.detectChanges();

    intersectionCallback([{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry]);
    tick(1200);
    fixture.detectChanges();

    expect(component.mostrarBotonPlay()).toBeFalse();
  }));
});
