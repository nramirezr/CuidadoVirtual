import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ReelsPlayerPoolService } from './reels-player-pool.service';
import { ReelsAudioStateService } from './reels-audio-state.service';
import { YoutubeApiLoaderService } from './youtube-api-loader.service';

const ESTADO = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

class FakePlayer {
  static instances: FakePlayer[] = [];
  playVideo = jasmine.createSpy('playVideo');
  pauseVideo = jasmine.createSpy('pauseVideo');
  seekTo = jasmine.createSpy('seekTo');
  mute = jasmine.createSpy('mute');
  unMute = jasmine.createSpy('unMute');
  isMuted = jasmine.createSpy('isMuted').and.returnValue(false);
  loadVideoById = jasmine.createSpy('loadVideoById');
  cueVideoById = jasmine.createSpy('cueVideoById');
  unloadModule = jasmine.createSpy('unloadModule');
  destroy = jasmine.createSpy('destroy');

  constructor(public destino: HTMLElement, public options: any) {
    FakePlayer.instances.push(this);
    options.events?.onReady?.({ target: this });
  }

  emitir(estado: number): void {
    this.options.events.onStateChange({ data: estado, target: this });
  }
}

describe('ReelsPlayerPoolService', () => {
  let pool: ReelsPlayerPoolService;
  let audio: ReelsAudioStateService;
  let capa: HTMLElement;

  beforeEach(() => {
    (window as any).YT = { Player: FakePlayer, PlayerState: ESTADO };
    FakePlayer.instances = [];

    TestBed.configureTestingModule({
      providers: [{ provide: YoutubeApiLoaderService, useValue: { load: () => Promise.resolve() } }]
    });
    pool = TestBed.inject(ReelsPlayerPoolService);
    audio = TestBed.inject(ReelsAudioStateService);
    audio.muted.set(true);

    capa = document.createElement('div');
    pool.registrarCapa(capa);
  });

  afterEach(() => pool.liberar());

  function iniciar(): void {
    flushMicrotasks();
  }

  it('should create exactly two shared players, only once', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    expect(FakePlayer.instances.length).toBe(2);

    pool.activar('b', 'vidB');
    pool.activar('c', 'vidC');
    pool.precargar('vidD');
    iniciar();
    expect(FakePlayer.instances.length).toBe(2);
    expect(capa.querySelectorAll('.ranura-youtube').length).toBe(2);
    tick(1500);
    pool.liberar();
  }));

  it('should load the video in a slot and show only that slot', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();

    const conVideo = FakePlayer.instances.filter((p) => p.loadVideoById.calls.count() > 0);
    expect(conVideo.length).toBe(1);
    expect(conVideo[0].loadVideoById).toHaveBeenCalledWith('vidA');

    const visibles = Array.from(capa.querySelectorAll<HTMLElement>('.ranura-youtube')).filter(
      (h) => h.style.visibility === 'visible'
    );
    expect(visibles.length).toBe(1);
    expect(pool.activa().key).toBe('a');
    tick(1500);
    pool.liberar();
  }));

  it('should preload the next video in the idle slot and use it without reloading when it becomes active', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    pool.precargar('vidB');
    tick(150);

    const precargado = FakePlayer.instances.find((p) => p.cueVideoById.calls.count() > 0)!;
    expect(precargado.cueVideoById).toHaveBeenCalledWith('vidB');

    pool.activar('b', 'vidB');
    expect(precargado.loadVideoById).not.toHaveBeenCalled();
    expect(precargado.playVideo).toHaveBeenCalled();
    tick(1500);
    pool.liberar();
  }));

  it('should not overwrite the preloaded video when the next card asks to preload before the activation is processed', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    pool.precargar('vidB');
    tick(150);
    const precargado = FakePlayer.instances.find((p) => p.cueVideoById.calls.count() > 0)!;
    precargado.cueVideoById.calls.reset();

    // Orden real al hacer swipe: la tarjeta C pide precargar y justo después B pasa a ser visible.
    pool.precargar('vidC');
    pool.activar('b', 'vidB');
    tick(150);

    expect(precargado.loadVideoById).not.toHaveBeenCalled();
    expect(precargado.cueVideoById).not.toHaveBeenCalledWith('vidC');
    expect(precargado.playVideo).toHaveBeenCalled();
    const otro = FakePlayer.instances.find((p) => p !== precargado)!;
    expect(otro.cueVideoById).toHaveBeenCalledWith('vidC');
    tick(1500);
    pool.liberar();
  }));

  it('should pause the previous video (rewinding it if it had played) when another one takes over', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    const primero = FakePlayer.instances.find((p) => p.loadVideoById.calls.count() > 0)!;
    primero.emitir(ESTADO.PLAYING);

    pool.activar('b', 'vidB');
    expect(primero.pauseVideo).toHaveBeenCalled();
    expect(primero.seekTo).toHaveBeenCalledWith(0, true);
    tick(1500);
    pool.liberar();
  }));

  it('should not seek a video that never played (seekTo would make YouTube start it)', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    const primero = FakePlayer.instances.find((p) => p.loadVideoById.calls.count() > 0)!;

    pool.activar('b', 'vidB');
    expect(primero.pauseVideo).toHaveBeenCalled();
    expect(primero.seekTo).not.toHaveBeenCalled();
    tick(1500);
    pool.liberar();
  }));

  it('should ignore a repeated activation of the same card (the observer fires at 60% and again at 100%)', fakeAsync(() => {
    audio.muted.set(false);
    pool.activar('a', 'vidA');
    iniciar();
    const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
    p.emitir(ESTADO.PLAYING);
    expect(pool.activa().reproduciendo).toBeTrue();
    p.playVideo.calls.reset();

    pool.activar('a', 'vidA');
    tick(1500 * 3);

    expect(pool.activa().reproduciendo).toBeTrue();
    expect(pool.activa().mostrarBotonPlay).toBeFalse();
    expect(audio.muted()).toBeFalse();
    expect(p.playVideo).not.toHaveBeenCalled();
  }));

  it('should flag the active card as playing when YouTube reports PLAYING', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
    expect(pool.activa().reproduciendo).toBeFalse();

    p.emitir(ESTADO.PLAYING);
    expect(pool.activa().reproduciendo).toBeTrue();
    expect(p.unloadModule).toHaveBeenCalledWith('captions');
  }));

  it('should pause a slot that starts playing while it is not the active one (scroll race)', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    const inactivo = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() === 0)!;

    inactivo.emitir(ESTADO.PLAYING);
    expect(inactivo.pauseVideo).toHaveBeenCalled();
    expect(pool.activa().reproduciendo).toBeFalse();
    tick(1500);
    pool.liberar();
  }));

  it('should loop the video by itself when it ends', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
    p.playVideo.calls.reset();

    p.emitir(ESTADO.ENDED);
    expect(p.seekTo).toHaveBeenCalledWith(0, true);
    expect(p.playVideo).toHaveBeenCalled();
    tick(1500);
    pool.liberar();
  }));

  it('should work when the card asks before the layer is registered', fakeAsync(() => {
    pool.liberar();
    pool.activar('a', 'vidA');
    iniciar();
    expect(FakePlayer.instances.length).toBe(0);

    pool.registrarCapa(capa);
    iniciar();
    expect(FakePlayer.instances.length).toBe(2);
    expect(FakePlayer.instances.some((p) => p.loadVideoById.calls.count() > 0)).toBeTrue();
    tick(1500);
    pool.liberar();
  }));

  describe('autoplay fallback', () => {
    it('should fall back to muted autoplay, silencing the player BEFORE asking to play, when sound is blocked', fakeAsync(() => {
      audio.muted.set(false);
      pool.activar('a', 'vidA');
      iniciar();
      const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
      const orden: string[] = [];
      p.mute.and.callFake(() => orden.push('mute'));
      p.playVideo.and.callFake(() => orden.push('play'));
      p.emitir(ESTADO.UNSTARTED);

      tick(1500);

      expect(audio.muted()).toBeTrue();
      expect(orden.indexOf('mute')).toBeGreaterThanOrEqual(0);
      expect(orden.indexOf('mute')).toBeLessThan(orden.indexOf('play'));
      expect(pool.activa().mostrarBotonPlay).toBeFalse();

      tick(1500);
      expect(pool.activa().mostrarBotonPlay).toBeTrue();
      pool.liberar();
    }));

    it('should not mute because of a slow load: while buffering it keeps waiting', fakeAsync(() => {
      audio.muted.set(false);
      pool.activar('a', 'vidA');
      iniciar();
      const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
      p.emitir(ESTADO.BUFFERING);

      tick(1500 * 3);
      expect(audio.muted()).toBeFalse();
      expect(pool.activa().mostrarBotonPlay).toBeFalse();

      p.emitir(ESTADO.PLAYING);
      tick(1500 * 3);
      expect(audio.muted()).toBeFalse();
    }));

    it('should show the real audio state when the browser forces the video muted', fakeAsync(() => {
      audio.muted.set(false);
      pool.activar('a', 'vidA');
      iniciar();
      const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
      p.isMuted.and.returnValue(true);

      p.emitir(ESTADO.PLAYING);
      expect(audio.muted()).toBeTrue();
    }));

    it('should play muted after the manual play button is tapped if sound still does not start', fakeAsync(() => {
      audio.muted.set(true);
      pool.activar('a', 'vidA');
      iniciar();
      tick(1500 * 2);
      expect(pool.activa().mostrarBotonPlay).toBeTrue();

      audio.muted.set(false);
      const p = FakePlayer.instances.find((x) => x.loadVideoById.calls.count() > 0)!;
      p.playVideo.calls.reset();
      pool.reproducirManual();
      expect(p.playVideo).toHaveBeenCalledTimes(1);

      tick(1500);
      expect(audio.muted()).toBeTrue();
      expect(p.playVideo).toHaveBeenCalledTimes(2);
      pool.liberar();
    }));
  });

  it('should re-assert the audio unlock on every gesture when sound is on, on both players', fakeAsync(() => {
    audio.muted.set(false);
    pool.activar('a', 'vidA');
    iniciar();
    FakePlayer.instances.forEach((p) => p.unMute.calls.reset());

    pool.desbloquearAudio();
    expect(FakePlayer.instances.every((p) => p.unMute.calls.count() === 1)).toBeTrue();

    audio.muted.set(true);
    FakePlayer.instances.forEach((p) => p.unMute.calls.reset());
    pool.desbloquearAudio();
    expect(FakePlayer.instances.every((p) => p.unMute.calls.count() === 0)).toBeTrue();
    tick(1500 * 3);
    pool.liberar();
  }));

  it('should mark movement while scrolling and clear it shortly after', fakeAsync(() => {
    pool.marcarMovimiento();
    expect(pool.enMovimiento()).toBeTrue();
    tick(200);
    expect(pool.enMovimiento()).toBeFalse();
  }));

  it('should destroy both players and empty its state on release', fakeAsync(() => {
    pool.activar('a', 'vidA');
    iniciar();
    pool.liberar();

    expect(FakePlayer.instances.every((p) => p.destroy.calls.count() === 1)).toBeTrue();
    expect(capa.querySelectorAll('.ranura-youtube').length).toBe(0);
    expect(pool.activa().key).toBeNull();
  }));
});
