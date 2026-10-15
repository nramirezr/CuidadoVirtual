import { Injectable } from '@angular/core';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ESPERA_MAXIMA_API_MS = 15000;

@Injectable({ providedIn: 'root' })
export class YoutubeApiLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (window.YT && window.YT.Player) {
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }

    // Si la descarga falla (red lenta o intermitente en celular) se olvida la
    // promesa para que el próximo intento vuelva a pedir el script, en vez de
    // dejar a todos los videos esperando para siempre.
    this.loadPromise = this.cargarScript().catch((error) => {
      this.loadPromise = null;
      throw error;
    });
    return this.loadPromise;
  }

  private cargarScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      const script = document.createElement('script');
      const timeoutId = setTimeout(() => fallar(), ESPERA_MAXIMA_API_MS);

      const fallar = () => {
        clearTimeout(timeoutId);
        script.remove();
        window.onYouTubeIframeAPIReady = previousCallback;
        reject(new Error('No se pudo cargar la API de YouTube'));
      };

      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeoutId);
        previousCallback?.();
        resolve();
      };

      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = fallar;
      document.head.appendChild(script);
    });
  }
}
