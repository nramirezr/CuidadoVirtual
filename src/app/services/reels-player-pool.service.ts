import { Injectable, effect, inject, signal } from '@angular/core';
import { ReelsAudioStateService } from './reels-audio-state.service';
import { YoutubeApiLoaderService } from './youtube-api-loader.service';

/** Tiempo tras pedir reproducir antes de concluir que no arrancó. */
const ESPERA_ANTES_DE_EVALUAR_MS = 1500;
/** Cuántas veces más se espera si el video sigue cargando (buffering). */
const MAX_ESPERAS_POR_CARGA = 10;
const ESPERA_REINTENTO_TRAS_TOQUE_MS = 1500;
const ESPERA_REINTENTO_API_MS = 3000;
const ESPERA_FIN_DE_MOVIMIENTO_MS = 150;
/** Las precargas esperan un instante para que la activación del video que acaba
 * de llegar a pantalla (que se procesa en el mismo cuadro) vaya primero: si no,
 * la precarga del siguiente pisa el video que justo iba a reproducirse. */
const ESPERA_PRECARGA_MS = 120;
/** Si el video arrancó por el toque en la categoría y el feed nunca llega a
 * pedirlo (error, la persona volvió atrás), se detiene para que no quede sonando. */
const ESPERA_HUERFANO_MS = 12000;
const CANTIDAD_RANURAS = 2;

interface Ranura {
  host: HTMLElement;
  player?: YT.Player;
  listo: boolean;
  videoId?: string;
  estado?: number;
  reproducido: boolean;
}

export interface EstadoReproductorActivo {
  /** Tarjeta a la que pertenece el video que se está mostrando. */
  key: string | null;
  reproduciendo: boolean;
  mostrarBotonPlay: boolean;
}

/**
 * Reproductores de YouTube compartidos por todo el feed.
 *
 * Solo existen DOS iframes (creados una vez al abrir el feed) y se les va
 * cambiando el video con `loadVideoById`, en vez de crear un iframe por
 * tarjeta. Esto resuelve dos problemas reales en iPhone:
 *  - Memoria: un iframe de YouTube pesa mucho y la página se caía (Safari,
 *    Brave) al acumular 3 o 4.
 *  - Audio: Safari solo desbloquea el sonido en los iframes que YA existían
 *    cuando la persona tocó el botón de sonido. Con un iframe nuevo por video,
 *    uno sí y otro no tenían audio. Con los mismos dos iframes de siempre, el
 *    desbloqueo vale para todos los videos.
 *
 * Uno está visible y reproduciendo; el otro se usa para dejar listo (cued) el
 * video siguiente y que el swipe sea casi instantáneo.
 */
@Injectable({ providedIn: 'root' })
export class ReelsPlayerPoolService {
  private readonly cargadorApi = inject(YoutubeApiLoaderService);
  private readonly audio = inject(ReelsAudioStateService);

  readonly activa = signal<EstadoReproductorActivo>({
    key: null,
    reproduciendo: false,
    mostrarBotonPlay: false
  });

  /** true mientras el feed se está desplazando: las tarjetas muestran su miniatura. */
  readonly enMovimiento = signal(false);

  private capa?: HTMLElement;
  private ranuras: Ranura[] = [];
  private ranuraActiva?: Ranura;
  private creando = false;
  private pendienteActivar?: { key: string; videoId: string };
  private pendientePrecargar?: string;
  private esperasPorCarga = 0;

  private evaluacionId?: ReturnType<typeof setTimeout>;
  private toqueId?: ReturnType<typeof setTimeout>;
  private reintentoApiId?: ReturnType<typeof setTimeout>;
  private movimientoId?: ReturnType<typeof setTimeout>;
  private precargaId?: ReturnType<typeof setTimeout>;
  private huerfanoId?: ReturnType<typeof setTimeout>;
  private creacionPedida = false;

  constructor() {
    effect(() => {
      const silenciado = this.audio.muted();
      for (const r of this.ranuras) {
        if (r.listo && r.player) {
          silenciado ? r.player.mute() : r.player.unMute();
        }
      }
    });
  }

  /** La app entrega el contenedor (persistente, fuera de las páginas) donde viven los dos iframes. */
  registrarCapa(capa: HTMLElement): void {
    this.capa = capa;
    if (this.creacionPedida || this.pendienteActivar || this.pendientePrecargar) {
      this.asegurarRanuras();
    }
  }

  /**
   * Crea los dos reproductores si todavía no existen. Se pide en la bienvenida
   * y en las categorías para que YA existan cuando la persona toque una
   * categoría: Safari solo desbloquea el sonido en iframes existentes en el
   * momento del toque.
   */
  asegurar(): void {
    this.creacionPedida = true;
    this.asegurarRanuras();
  }

  /**
   * Debe llamarse DENTRO del toque en una categoría (gesto real de la persona).
   * Desbloquea el sonido en los dos reproductores y, si se conoce el primer
   * video, lo arranca ya con sonido; seguirá sonando cuando el feed termine de
   * cargar y lo reclame con `activar()`. Verificado en Safari de iPhone: un
   * reproductor recién creado y en blanco acepta el sonido si se le pide dentro
   * del toque, y los videos siguientes suenan sin más gestos.
   */
  iniciarDesdeGesto(videoId?: string): void {
    this.audio.muted.set(false);
    for (const r of this.ranuras) {
      if (r.listo && r.player) {
        r.player.unMute();
      }
    }
    const ranura = this.ranuras.find((r) => r.listo && r.player);
    if (!videoId || !ranura) {
      return;
    }
    this.cancelarEvaluacion();
    this.pendienteActivar = undefined;
    this.ranuraActiva = ranura;
    ranura.videoId = videoId;
    ranura.reproducido = false;
    for (const r of this.ranuras) {
      r.host.style.visibility = r === ranura ? 'visible' : 'hidden';
    }
    this.activa.set({ key: null, reproduciendo: false, mostrarBotonPlay: false });
    ranura.player?.loadVideoById(videoId);
    this.programarEvaluacion();
    clearTimeout(this.huerfanoId);
    this.huerfanoId = setTimeout(() => {
      if (this.activa().key === null) {
        this.ocultarCapa();
      }
    }, ESPERA_HUERFANO_MS);
  }

  /** El feed muestra la capa justo detrás de su lista, con la geometría de su área de video. */
  mostrarCapa(rect: { top: number; left: number; width: number; height: number }): void {
    const capa = this.capa;
    if (!capa) {
      return;
    }
    capa.style.top = `${rect.top}px`;
    capa.style.left = `${rect.left}px`;
    capa.style.width = `${rect.width}px`;
    capa.style.height = `${rect.height}px`;
    capa.style.opacity = '1';
  }

  /**
   * Al salir del feed: se pausa y se oculta la capa, pero los iframes NO se
   * destruyen (siguen desbloqueados para la próxima categoría y no se vuelve a
   * pagar su creación). Se usa opacity y no display:none porque Safari no
   * reproduce iframes que no se renderizan.
   */
  ocultarCapa(): void {
    this.cancelarEvaluacion();
    clearTimeout(this.toqueId);
    clearTimeout(this.precargaId);
    clearTimeout(this.huerfanoId);
    clearTimeout(this.movimientoId);
    if (this.ranuraActiva) {
      this.detener(this.ranuraActiva);
    }
    for (const r of this.ranuras) {
      r.host.style.visibility = 'hidden';
    }
    this.ranuraActiva = undefined;
    this.pendienteActivar = undefined;
    this.pendientePrecargar = undefined;
    this.enMovimiento.set(false);
    this.activa.set({ key: null, reproduciendo: false, mostrarBotonPlay: false });
    if (this.capa) {
      this.capa.style.opacity = '0';
    }
  }

  /** Muestra y reproduce `videoId` (el video que está en pantalla). */
  activar(key: string, videoId: string): void {
    // El observer de visibilidad avisa varias veces por la misma tarjeta (al
    // cruzar 60 % y luego 100 %). Repetir la activación reiniciaba el estado y
    // el sistema creía que el video no había arrancado: silenciaba el audio y
    // mostraba el botón ▶ con el video ya reproduciéndose.
    if (
      this.activa().key === key &&
      !this.pendienteActivar &&
      this.ranuraActiva?.videoId === videoId
    ) {
      return;
    }
    this.cancelarEvaluacion();
    clearTimeout(this.huerfanoId);
    this.activa.set({ key, reproduciendo: false, mostrarBotonPlay: false });
    this.pendienteActivar = { key, videoId };
    this.asegurarRanuras();
    this.aplicarActivacion();
  }

  /** Deja listo (sin reproducir) el video que viene a continuación. */
  precargar(videoId: string): void {
    this.pendientePrecargar = videoId;
    this.asegurarRanuras();
    clearTimeout(this.precargaId);
    this.precargaId = setTimeout(() => this.aplicarPrecarga(), ESPERA_PRECARGA_MS);
  }

  /** Botón ▶ de respaldo: el toque de la persona es un gesto válido para el navegador. */
  reproducirManual(): void {
    const r = this.ranuraActiva;
    if (!r?.listo || !r.player) {
      return;
    }
    r.player.playVideo();
    // Algunos navegadores no aceptan que el toque habilite el sonido dentro
    // del iframe: si sigue sin reproducir, se reproduce en silencio.
    clearTimeout(this.toqueId);
    this.toqueId = setTimeout(() => {
      if (!this.activa().reproduciendo && !this.audio.muted()) {
        this.silenciarYReproducir(r);
      }
    }, ESPERA_REINTENTO_TRAS_TOQUE_MS);
  }

  /**
   * Debe llamarse desde un gesto real de la persona (toque, fin de swipe).
   * Safari solo permite sonido en un video si, estando ya cargado, se le pide
   * `unMute()` dentro de un gesto. El video siguiente se precarga ANTES del
   * swipe, así que se reafirma el desbloqueo en cada gesto sobre los dos
   * reproductores; sin esto, solo los videos que ya estaban cargados cuando se
   * tocó el botón de sonido podían sonar.
   */
  desbloquearAudio(): void {
    if (this.audio.muted()) {
      return;
    }
    for (const r of this.ranuras) {
      if (r.listo && r.player) {
        r.player.unMute();
      }
    }
  }

  /** El feed avisa que hay scroll en curso. */
  marcarMovimiento(): void {
    this.enMovimiento.set(true);
    clearTimeout(this.movimientoId);
    this.movimientoId = setTimeout(() => this.enMovimiento.set(false), ESPERA_FIN_DE_MOVIMIENTO_MS);
  }

  /** Destruye los iframes y libera la memoria (ya no se usa al salir del feed; ver ocultarCapa). */
  liberar(): void {
    clearTimeout(this.huerfanoId);
    this.cancelarEvaluacion();
    clearTimeout(this.toqueId);
    clearTimeout(this.reintentoApiId);
    clearTimeout(this.movimientoId);
    clearTimeout(this.precargaId);
    for (const r of this.ranuras) {
      // En iOS la memoria de un iframe destruido no siempre se libera; vaciar
      // su src antes de quitarlo ayuda a recuperarla.
      const iframe = r.host.querySelector('iframe');
      if (iframe) {
        iframe.src = 'about:blank';
      }
      if (r.player && typeof r.player.destroy === 'function') {
        r.player.destroy();
      }
      r.host.remove();
    }
    this.ranuras = [];
    this.ranuraActiva = undefined;
    this.capa = undefined;
    this.creando = false;
    this.creacionPedida = false;
    this.pendienteActivar = undefined;
    this.pendientePrecargar = undefined;
    this.enMovimiento.set(false);
    this.activa.set({ key: null, reproduciendo: false, mostrarBotonPlay: false });
  }

  // ---------- creación de los iframes ----------

  private asegurarRanuras(): void {
    if (this.ranuras.length || this.creando || !this.capa) {
      return;
    }
    this.creando = true;
    void this.crearRanuras();
  }

  private async crearRanuras(): Promise<void> {
    try {
      await this.cargadorApi.load();
    } catch {
      // Falló la descarga de la API de YouTube (red lenta o intermitente).
      this.creando = false;
      if (this.capa) {
        this.reintentoApiId = setTimeout(() => this.asegurarRanuras(), ESPERA_REINTENTO_API_MS);
      }
      return;
    }
    this.creando = false;
    const capa = this.capa;
    if (!capa || this.ranuras.length) {
      return;
    }
    for (let i = 0; i < CANTIDAD_RANURAS; i++) {
      this.crearRanura(capa);
    }
  }

  private crearRanura(capa: HTMLElement): void {
    const host = document.createElement('div');
    host.className = 'ranura-youtube';
    host.style.visibility = 'hidden';
    // YT.Player reemplaza el nodo que recibe por el iframe.
    const destino = document.createElement('div');
    host.appendChild(destino);
    capa.appendChild(host);

    const ranura: Ranura = { host, listo: false, reproducido: false };
    this.ranuras.push(ranura);
    ranura.player = new YT.Player(destino, {
      playerVars: {
        mute: this.audio.muted() ? 1 : 0,
        autoplay: 0,
        playsinline: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0
      },
      events: {
        // `event.target` es el player real: onReady puede dispararse antes de
        // que termine de asignarse `ranura.player`.
        onReady: (event) => {
          ranura.player = event.target;
          this.alEstarListo(ranura);
        },
        onStateChange: (event) => this.alCambiarEstado(ranura, event)
      }
    });
  }

  private alEstarListo(ranura: Ranura): void {
    ranura.listo = true;
    if (this.audio.muted()) {
      ranura.player?.mute();
    } else {
      ranura.player?.unMute();
    }
    this.desactivarSubtitulos(ranura.player);
    this.aplicarActivacion();
    this.aplicarPrecarga();
  }

  // ---------- activación / precarga ----------

  private aplicarActivacion(): void {
    const pendiente = this.pendienteActivar;
    if (!pendiente) {
      return;
    }
    const listas = this.ranuras.filter((r) => r.listo && r.player);
    if (!listas.length) {
      return;
    }
    const elegida =
      listas.find((r) => r.videoId === pendiente.videoId) ??
      listas.find((r) => r !== this.ranuraActiva) ??
      listas[0];
    this.pendienteActivar = undefined;

    const anterior = this.ranuraActiva;
    if (anterior && anterior !== elegida) {
      this.detener(anterior);
    }
    for (const r of this.ranuras) {
      r.host.style.visibility = r === elegida ? 'visible' : 'hidden';
    }
    this.ranuraActiva = elegida;

    const player = elegida.player as YT.Player;
    if (elegida.videoId === pendiente.videoId && elegida.estado === YT.PlayerState.PLAYING) {
      // Ya venía reproduciéndose (arrancó con el toque en la categoría): solo se
      // marca la tarjeta, sin reiniciar nada ni mostrar la miniatura.
      this.activa.set({ key: pendiente.key, reproduciendo: true, mostrarBotonPlay: false });
      return;
    }
    if (elegida.videoId === pendiente.videoId) {
      player.playVideo();
    } else {
      elegida.videoId = pendiente.videoId;
      elegida.reproducido = false;
      player.loadVideoById(pendiente.videoId);
    }
    this.programarEvaluacion();
  }

  private aplicarPrecarga(): void {
    const videoId = this.pendientePrecargar;
    if (!videoId) {
      return;
    }
    const libre = this.ranuras.find((r) => r.listo && r.player && r !== this.ranuraActiva);
    if (!libre) {
      return;
    }
    // Nunca se pisa un video que está por activarse ni el que ya está activo.
    if (
      this.ranuraActiva?.videoId === videoId ||
      libre.videoId === videoId ||
      (libre.videoId !== undefined && libre.videoId === this.pendienteActivar?.videoId)
    ) {
      this.pendientePrecargar = undefined;
      return;
    }
    this.pendientePrecargar = undefined;
    libre.videoId = videoId;
    libre.reproducido = false;
    libre.host.style.visibility = 'hidden';
    libre.player?.cueVideoById(videoId);
  }

  private detener(ranura: Ranura): void {
    const player = ranura.player;
    if (!ranura.listo || !player) {
      return;
    }
    player.pauseVideo();
    // Al volver a un video ya visto debe empezar de nuevo, como en un reel. Solo
    // si ya se había reproducido: seekTo() sobre un video que nunca arrancó hace
    // que YouTube lo empiece a reproducir solo.
    if (ranura.reproducido) {
      player.seekTo(0, true);
      ranura.reproducido = false;
    }
  }

  // ---------- estado del reproductor ----------

  private alCambiarEstado(ranura: Ranura, event: YT.OnStateChangeEvent): void {
    ranura.estado = event.data;
    if (ranura !== this.ranuraActiva) {
      // Carrera de scroll: YouTube a veces arranca un video que ya no está en
      // pantalla; se vuelve a pausar para no tener dos sonando a la vez.
      if (event.data === YT.PlayerState.PLAYING) {
        event.target.pauseVideo();
      }
      return;
    }
    if (event.data === YT.PlayerState.PLAYING) {
      this.alReproducir(ranura, event.target);
    } else if (event.data === YT.PlayerState.ENDED) {
      // Se hace el loop a mano porque el parámetro `loop` solo funciona con
      // playlist y el video cambia dentro del mismo iframe.
      event.target.seekTo(0, true);
      event.target.playVideo();
    }
  }

  private alReproducir(ranura: Ranura, player: YT.Player): void {
    const primeraVez = !this.activa().reproduciendo;
    ranura.reproducido = true;
    this.cancelarEvaluacion();
    clearTimeout(this.toqueId);
    this.activa.update((a) => ({ ...a, reproduciendo: true, mostrarBotonPlay: false }));
    // Si el navegador forzó el silencio, el ícono debe mostrar la realidad en
    // vez de aparentar sonido. Solo en el primer arranque, para no pelear con un
    // cambio hecho por la persona justo en ese momento.
    if (primeraVez && typeof player.isMuted === 'function') {
      const real = player.isMuted();
      if (real !== this.audio.muted()) {
        this.audio.muted.set(real);
      }
    }
    // El módulo de subtítulos de YouTube se carga recién al reproducir.
    this.desactivarSubtitulos(player);
  }

  private programarEvaluacion(): void {
    this.cancelarEvaluacion();
    this.esperasPorCarga = 0;
    this.evaluacionId = setTimeout(() => this.evaluarArranque(), ESPERA_ANTES_DE_EVALUAR_MS);
  }

  /**
   * Se ejecuta un momento después de pedir la reproducción. Si no arrancó:
   * - sigue cargando (buffering): se espera, no es un bloqueo;
   * - se pidió con sonido: el navegador bloqueó el autoplay con sonido, así que
   *   se reproduce en silencio para que el video siempre arranque solo, y el
   *   ícono pasa a 🔇 para que la persona pueda activarlo;
   * - ya estaba en silencio y aun así no arranca: se ofrece el botón de play.
   */
  private evaluarArranque(): void {
    const ranura = this.ranuraActiva;
    if (!ranura || this.activa().reproduciendo) {
      return;
    }
    // Si YouTube ya reporta PLAYING, no hay nada que rescatar.
    if (ranura.estado === YT.PlayerState.PLAYING) {
      this.activa.update((a) => ({ ...a, reproduciendo: true, mostrarBotonPlay: false }));
      return;
    }
    if (ranura.estado === YT.PlayerState.BUFFERING && this.esperasPorCarga < MAX_ESPERAS_POR_CARGA) {
      this.esperasPorCarga++;
      this.evaluacionId = setTimeout(() => this.evaluarArranque(), ESPERA_ANTES_DE_EVALUAR_MS);
      return;
    }
    if (!this.audio.muted()) {
      this.silenciarYReproducir(ranura);
      this.evaluacionId = setTimeout(() => this.evaluarArranque(), ESPERA_ANTES_DE_EVALUAR_MS);
      return;
    }
    this.activa.update((a) => ({ ...a, mostrarBotonPlay: true }));
  }

  /**
   * Silencia el reproductor ANTES de pedir la reproducción. Cambiar solo la
   * señal `muted` no basta: el efecto que lo aplica al reproductor corre
   * después, y el playVideo() ya habría salido con sonido (y habría sido
   * bloqueado de nuevo).
   */
  private silenciarYReproducir(ranura: Ranura): void {
    this.audio.muted.set(true);
    ranura.player?.mute();
    ranura.player?.playVideo();
  }

  private cancelarEvaluacion(): void {
    clearTimeout(this.evaluacionId);
    this.evaluacionId = undefined;
  }

  /**
   * Los videos ya traen sus subtítulos incrustados en la imagen; si además se
   * activan los de YouTube se ven duplicados. `unloadModule` no está en los
   * tipos oficiales de la API.
   */
  private desactivarSubtitulos(player?: YT.Player): void {
    const p = player as unknown as { unloadModule?: (modulo: string) => void } | undefined;
    p?.unloadModule?.('captions');
    p?.unloadModule?.('cc');
  }
}
