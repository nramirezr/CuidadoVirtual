import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { videoMod } from '../../models/videoMod.model';
import { ReelsAudioStateService } from '../../services/reels-audio-state.service';
import { YoutubeApiLoaderService } from '../../services/youtube-api-loader.service';

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
  private readonly youtubeApiLoader = inject(YoutubeApiLoaderService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private observer?: IntersectionObserver;
  private ytPlayer?: YT.Player;

  constructor() {
    effect(() => {
      const muted = this.audioState.muted();
      if (this.ytPlayer) {
        muted ? this.ytPlayer.mute() : this.ytPlayer.unMute();
      }
      if (this.videoElRef) {
        this.videoElRef.nativeElement.muted = muted;
      }
    });
  }

  get youtubeContainerId(): string {
    return `yt-player-${this.video.id}`;
  }

  ngAfterViewInit(): void {
    if (this.video.fuente === 'youtube') {
      this.initYoutubePlayer();
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          this.play();
        } else {
          this.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.ytPlayer?.destroy();
  }

  onToggleMute(): void {
    this.audioState.toggle();
  }

  private async initYoutubePlayer(): Promise<void> {
    await this.youtubeApiLoader.load();
    this.ytPlayer = new YT.Player(this.youtubeContainerId, {
      videoId: this.video.youtubeId,
      playerVars: {
        mute: 1,
        autoplay: 0,
        playsinline: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        loop: 1,
        playlist: this.video.youtubeId
      },
      events: {
        onReady: () => {
          if (!this.audioState.muted()) {
            this.ytPlayer?.unMute();
          }
        }
      }
    });
  }

  private play(): void {
    if (this.video.fuente === 'youtube') {
      this.ytPlayer?.playVideo();
    } else {
      this.videoElRef?.nativeElement.play().catch(() => {});
    }
  }

  private pause(): void {
    if (this.video.fuente === 'youtube') {
      this.ytPlayer?.pauseVideo();
    } else {
      this.videoElRef?.nativeElement.pause();
    }
  }
}
