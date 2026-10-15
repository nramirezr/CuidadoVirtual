import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReelCardComponent } from './reel-card.component';
import { ReelsPlayerPoolService } from '../../services/reels-player-pool.service';
import { videoMod } from '../../models/videoMod.model';

describe('ReelCardComponent', () => {
  let fixture: ComponentFixture<ReelCardComponent>;
  let component: ReelCardComponent;
  let poolFake: {
    activa: ReturnType<typeof signal<{ key: string | null; reproduciendo: boolean; mostrarBotonPlay: boolean }>>;
    enMovimiento: ReturnType<typeof signal<boolean>>;
    activar: jasmine.Spy;
    precargar: jasmine.Spy;
    reproducirManual: jasmine.Spy;
  };
  let visibilityCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  let proximityCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

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
    poolFake = {
      activa: signal({ key: null, reproduciendo: false, mostrarBotonPlay: false }),
      enMovimiento: signal(false),
      activar: jasmine.createSpy('activar'),
      precargar: jasmine.createSpy('precargar'),
      reproducirManual: jasmine.createSpy('reproducirManual')
    };

    spyOn(window as any, 'IntersectionObserver').and.callFake(function (callback: any, options: any) {
      if (options?.rootMargin) {
        proximityCallback = callback;
      } else {
        visibilityCallback = callback;
      }
      return { observe: jasmine.createSpy('observe'), disconnect: jasmine.createSpy('disconnect') };
    });

    await TestBed.configureTestingModule({
      imports: [ReelCardComponent],
      providers: [{ provide: ReelsPlayerPoolService, useValue: poolFake }]
    }).compileComponents();
  });

  function createComponent(video: videoMod): void {
    fixture = TestBed.createComponent(ReelCardComponent);
    component = fixture.componentInstance;
    component.video = video;
    fixture.detectChanges();
  }

  const visible = (): void =>
    visibilityCallback([{ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry]);
  const fueraDePantalla = (): void =>
    visibilityCallback([{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry]);
  const cerca = (valor: boolean): void =>
    proximityCallback([{ isIntersecting: valor } as IntersectionObserverEntry]);

  it('should create', () => {
    createComponent(mp4Video);
    expect(component).toBeTruthy();
  });

  it('should not create an iframe per card: youtube cards only show a thumbnail', () => {
    createComponent(youtubeVideo);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('iframe')).toBeFalsy();
    expect(el.querySelector('video.mp4-video')).toBeFalsy();
    const thumb = el.querySelector('img.yt-thumb') as HTMLImageElement;
    expect(thumb).toBeTruthy();
    expect(thumb.src).toContain('abc123');
  });

  it('should render a video tag for mp4-sourced videos', () => {
    createComponent(mp4Video);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('video.mp4-video')).toBeTruthy();
    expect(el.querySelector('img.yt-thumb')).toBeFalsy();
  });

  it('should toggle the shared mute state when the mute button is clicked', () => {
    createComponent(mp4Video);
    const antes = component.audioState.muted();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.mute-button');
    button.click();

    expect(component.audioState.muted()).toBe(!antes);
  });

  describe('youtube card', () => {
    it('should ask the shared player to play its video when it becomes visible', () => {
      createComponent(youtubeVideo);
      visible();
      expect(poolFake.activar).toHaveBeenCalledWith('test-yt', 'abc123');
    });

    it('should not touch the shared player when it leaves the screen (the next card takes over)', () => {
      createComponent(youtubeVideo);
      visible();
      poolFake.activar.calls.reset();
      fueraDePantalla();
      expect(poolFake.activar).not.toHaveBeenCalled();
    });

    it('should preload its video when it is the next one (near but not visible)', () => {
      createComponent(youtubeVideo);
      cerca(true);
      expect(poolFake.precargar).toHaveBeenCalledWith('abc123');
    });

    it('should not preload when it is already the visible card', () => {
      createComponent(youtubeVideo);
      visible();
      cerca(true);
      expect(poolFake.precargar).not.toHaveBeenCalled();
    });

    it('should hide the thumbnail once its video is playing, and show it again while scrolling', () => {
      createComponent(youtubeVideo);
      poolFake.activa.set({ key: 'test-yt', reproduciendo: true, mostrarBotonPlay: false });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img.yt-thumb')).toBeFalsy();

      poolFake.enMovimiento.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img.yt-thumb')).toBeTruthy();
    });

    it('should keep the thumbnail when another card is the one playing', () => {
      createComponent(youtubeVideo);
      poolFake.activa.set({ key: 'otra', reproduciendo: true, mostrarBotonPlay: false });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img.yt-thumb')).toBeTruthy();
    });

    it('should show the manual play button only for the active card and delegate the tap', () => {
      createComponent(youtubeVideo);
      poolFake.activa.set({ key: 'otra', reproduciendo: false, mostrarBotonPlay: true });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.play-fallback-button')).toBeFalsy();

      poolFake.activa.set({ key: 'test-yt', reproduciendo: false, mostrarBotonPlay: true });
      fixture.detectChanges();
      const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.play-fallback-button');
      expect(boton).toBeTruthy();

      boton.click();
      expect(poolFake.reproducirManual).toHaveBeenCalled();
    });
  });

  describe('mp4 card', () => {
    it('should only set the mp4 src while the card is near the viewport', () => {
      createComponent(mp4Video);
      const el: HTMLVideoElement = fixture.nativeElement.querySelector('video.mp4-video');
      expect(el.getAttribute('src')).toBeNull();

      cerca(true);
      fixture.detectChanges();
      expect(el.getAttribute('src')).toBe(mp4Video.mp4Url!);

      cerca(false);
      fixture.detectChanges();
      expect(el.getAttribute('src')).toBeNull();
    });

    it('should not use the shared youtube player', () => {
      createComponent(mp4Video);
      cerca(true);
      visible();
      expect(poolFake.activar).not.toHaveBeenCalled();
      expect(poolFake.precargar).not.toHaveBeenCalled();
    });
  });
});
