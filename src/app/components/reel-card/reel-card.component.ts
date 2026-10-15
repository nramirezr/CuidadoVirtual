import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { videoMod } from '../../models/videoMod.model';
import { ReelsAudioStateService } from '../../services/reels-audio-state.service';
import { ReelsPlayerPoolService } from '../../services/reels-player-pool.service';

/** Cuánto esperar visible sin que arranque un video mp4 antes de recurrir al
 * respaldo (silencio y, si aún así no arranca, botón manual de "reproducir"). */
const ESPERA_ANTES_DE_MOSTRAR_PLAY_MS = 1500;

/**
 * Una tarjeta del feed.
 *
 * Los videos de YouTube NO se reproducen aquí: viven en dos reproductores
 * compartidos (ver ReelsPlayerPoolService) que se muestran "por detrás" de la
 * tarjeta activa. La tarjeta solo avisa al servicio cuándo está en pantalla y
 * muestra su miniatura mientras ese video no se está reproduciendo. Los videos
 * mp4 sí son un <video> propio de la tarjeta.
 */
@Component({
  selector: 'app-reel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reel-card.component.html',
  styleUrl: './reel-card.component.css'
})
export class ReelCardComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) video!: videoMod;

  @ViewChild('videoEl') videoElRef?: ElementRef<HTMLVideoElement>;

  readonly audioState = inject(ReelsAudioStateService);
  private readonly pool = inject(ReelsPlayerPoolService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private observer?: IntersectionObserver;
  private proximityObserver?: IntersectionObserver;
  private mostrarPlayTimeoutId?: ReturnType<typeof setTimeout>;

  /** true mientras la tarjeta está cerca del área visible (el siguiente video).
   * Solo entonces se precarga: el mp4 recién ahí recibe su `src`, y el video de
   * YouTube se deja listo en el reproductor libre. */
  readonly estaCerca = signal(false);

  /** Último estado de visibilidad conocido. */
  private readonly isVisible = signal(false);

  /** Solo mp4: true una vez que el video efectivamente empieza a reproducirse. */
  private readonly reproduciendoMp4 = signal(false);
  private readonly botonPlayMp4 = signal(false);

  private get esYoutube(): boolean {
    return this.video.fuente === 'youtube';
  }

  /** ¿Es el video de esta tarjeta el que está mostrando el reproductor compartido? */
  readonly esActiva = computed(() => this.pool.activa().key === this.video?.id);

  readonly reproduciendo = computed(() =>
    this.esYoutube ? this.esActiva() && this.pool.activa().reproduciendo : this.reproduciendoMp4()
  );

  /** La miniatura tapa el reproductor compartido salvo cuando este video ya se
   * está reproduciendo y la lista está quieta (durante un swipe cada tarjeta
   * muestra su imagen para que el movimiento se vea natural). */
  readonly mostrarMiniatura = computed(
    () => this.esYoutube && (!this.reproduciendo() || this.pool.enMovimiento())
  );

  readonly mostrarBotonPlay = computed(() =>
    this.esYoutube ? this.esActiva() && this.pool.activa().mostrarBotonPlay : this.botonPlayMp4()
  );

  constructor() {
    effect(() => {
      const muted = this.audioState.muted();
      if (this.videoElRef) {
        this.videoElRef.nativeElement.muted = muted;
      }
    });
  }

  get miniaturaYoutube(): string {
    return `https://i.ytimg.com/vi/${this.video.youtubeId}/hqdefault.jpg`;
  }

  ngAfterViewInit(): void {
    if (!this.esYoutube) {
      const el = this.videoElRef?.nativeElement;
      el?.addEventListener('loadeddata', () => {
        if (this.isVisible() && !this.reproduciendoMp4()) {
          this.play();
          this.programarRespaldoMp4();
        }
      });
      el?.addEventListener('playing', () => {
        if (this.isVisible()) {
          this.alIniciarMp4();
        } else {
          this.pause();
        }
      });
      el?.addEventListener('loadedmetadata', () => this.desactivarSubtitulosNativos(el));
    }

    // Se declara antes que el observer de visibilidad para que la tarjeta
    // cercana ya esté precargada cuando llegue a ser visible.
    const contenedor = (this.elementRef.nativeElement as HTMLElement).closest('.reels-scroll-container');
    this.proximityObserver = new IntersectionObserver(
      ([entry]) => this.onCambioDeCercania(entry.isIntersecting),
      // Solo se anticipa el video de ABAJO (el siguiente). El -2px evita que la
      // tarjeta de arriba, cuyo borde toca el del área visible, cuente como
      // "intersecta" (un borde que solo se toca ya es intersección).
      { root: contenedor, rootMargin: '-2px 0px 50% 0px' }
    );
    this.proximityObserver.observe(this.elementRef.nativeElement);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.6;
        this.isVisible.set(visible);
        if (visible) {
          this.alVolverseVisible();
        } else if (!this.esYoutube) {
          this.pause();
          this.cancelarRespaldoMp4();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.proximityObserver?.disconnect();
    this.cancelarRespaldoMp4();
  }

  onToggleMute(): void {
    this.audioState.toggle();
  }

  /**
   * Reintento manual: el autoplay no está garantizado en todos los navegadores,
   * así que se ofrece este botón como red de seguridad cuando no arrancó solo.
   */
  onTapPlay(): void {
    if (this.esYoutube) {
      this.pool.reproducirManual();
    } else {
      this.play();
    }
  }

  private alVolverseVisible(): void {
    if (this.esYoutube) {
      this.pool.activar(this.video.id, this.video.youtubeId ?? '');
      return;
    }
    this.play();
    const el = this.videoElRef?.nativeElement;
    // Si el mp4 aún está cargando no es un autoplay bloqueado: el respaldo se
    // arma recién cuando tenga datos (evento loadeddata).
    if (el && el.readyState >= 2) {
      this.programarRespaldoMp4();
    }
  }

  private onCambioDeCercania(cerca: boolean): void {
    if (this.estaCerca() === cerca) {
      return;
    }
    this.estaCerca.set(cerca);
    if (this.esYoutube) {
      if (cerca && !this.isVisible() && this.video.youtubeId) {
        this.pool.precargar(this.video.youtubeId);
      }
    } else if (!cerca) {
      this.descargarMp4();
    }
  }

  // ---------- video mp4 propio ----------

  private alIniciarMp4(): void {
    this.reproduciendoMp4.set(true);
    this.botonPlayMp4.set(false);
    this.cancelarRespaldoMp4();
  }

  private programarRespaldoMp4(): void {
    this.cancelarRespaldoMp4();
    this.mostrarPlayTimeoutId = setTimeout(() => this.evaluarArranqueMp4(), ESPERA_ANTES_DE_MOSTRAR_PLAY_MS);
  }

  /** Si el mp4 no arrancó: primero en silencio (el sonido pudo ser bloqueado), luego botón ▶. */
  private evaluarArranqueMp4(): void {
    const el = this.videoElRef?.nativeElement;
    if (!el || !this.isVisible() || this.reproduciendoMp4()) {
      return;
    }
    if (!this.audioState.muted()) {
      this.audioState.muted.set(true);
      el.muted = true;
      this.play();
      this.mostrarPlayTimeoutId = setTimeout(() => this.evaluarArranqueMp4(), ESPERA_ANTES_DE_MOSTRAR_PLAY_MS);
      return;
    }
    this.botonPlayMp4.set(true);
  }

  private cancelarRespaldoMp4(): void {
    if (this.mostrarPlayTimeoutId !== undefined) {
      clearTimeout(this.mostrarPlayTimeoutId);
      this.mostrarPlayTimeoutId = undefined;
    }
    this.botonPlayMp4.set(false);
  }

  private descargarMp4(): void {
    const el = this.videoElRef?.nativeElement;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    this.reproduciendoMp4.set(false);
  }

  private desactivarSubtitulosNativos(el: HTMLVideoElement): void {
    for (let i = 0; i < el.textTracks.length; i++) {
      el.textTracks[i].mode = 'disabled';
    }
  }

  private play(): void {
    const el = this.videoElRef?.nativeElement;
    el?.play().catch(() => {
      // Autoplay con sonido bloqueado: se reintenta en silencio.
      if (el && !el.muted) {
        this.audioState.muted.set(true);
        el.muted = true;
        el.play().catch(() => {});
      }
    });
  }

  private pause(): void {
    const el = this.videoElRef?.nativeElement;
    el?.pause();
    if (el) {
      el.currentTime = 0;
    }
    this.reproduciendoMp4.set(false);
  }
}
