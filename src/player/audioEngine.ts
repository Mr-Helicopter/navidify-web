import { EQ_FREQUENCIES, type EqPreset } from './eqPresets';
import { getStreamUrl } from '../api/subsonic';
import type { Song } from '../types/subsonic';

export interface AudioEngineListeners {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (err: Error) => void;
  onTrackChange?: (song: Song) => void;
}

class AudioEngine {
  private audioA: HTMLAudioElement;
  private audioB: HTMLAudioElement;
  private activeSlot: 'A' | 'B' = 'A';

  private audioCtx: AudioContext | null = null;
  private sourceA: MediaElementAudioSourceNode | null = null;
  private sourceB: MediaElementAudioSourceNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];

  private listeners: AudioEngineListeners = {};
  private currentTrack: Song | null = null;
  private preloadedTrack: Song | null = null;
  private volume = 1;
  private isMuted = false;
  private eqEnabled = true;
  private eqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private isPreloadedReady = false;

  constructor() {
    this.audioA = new Audio();
    this.audioB = new Audio();

    this.setupAudioElement(this.audioA, 'A');
    this.setupAudioElement(this.audioB, 'B');
  }

  private setupAudioElement(el: HTMLAudioElement, slot: 'A' | 'B') {
    el.crossOrigin = 'anonymous';
    el.preload = 'metadata';

    el.addEventListener('timeupdate', () => {
      if (this.activeSlot === slot && this.listeners.onTimeUpdate) {
        this.listeners.onTimeUpdate(el.currentTime, el.duration || 0);
      }
    });

    el.addEventListener('play', () => {
      if (this.activeSlot === slot && this.listeners.onPlay) {
        this.listeners.onPlay();
      }
    });

    el.addEventListener('pause', () => {
      if (this.activeSlot === slot && this.listeners.onPause) {
        this.listeners.onPause();
      }
    });

    el.addEventListener('ended', () => {
      if (this.activeSlot === slot) {
        if (this.listeners.onEnded) {
          this.listeners.onEnded();
        }
      }
    });

    el.addEventListener('waiting', () => {
      if (this.activeSlot === slot && this.listeners.onLoading) {
        this.listeners.onLoading(true);
      }
    });

    el.addEventListener('playing', () => {
      if (this.activeSlot === slot && this.listeners.onLoading) {
        this.listeners.onLoading(false);
      }
    });

    el.addEventListener('error', () => {
      if (this.activeSlot === slot && this.listeners.onError) {
        this.listeners.onError(new Error(el.error?.message || 'Audio playback error'));
      }
    });
  }

  private initWebAudio() {
    if (this.audioCtx) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.sourceA = this.audioCtx.createMediaElementSource(this.audioA);
      this.sourceB = this.audioCtx.createMediaElementSource(this.audioB);

      this.gainA = this.audioCtx.createGain();
      this.gainB = this.audioCtx.createGain();
      this.masterGain = this.audioCtx.createGain();

      this.gainA.gain.value = 1;
      this.gainB.gain.value = 0;
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

      this.sourceA.connect(this.gainA);
      this.sourceB.connect(this.gainB);

      // Create 10-band EQ chain
      this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.eqEnabled ? this.eqGains[idx] : 0;
        return filter;
      });

      // Connect filter chain: gainA & gainB -> filter[0] -> filter[1] -> ... -> masterGain -> destination
      this.gainA.connect(this.eqFilters[0]);
      this.gainB.connect(this.eqFilters[0]);

      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }
      this.eqFilters[this.eqFilters.length - 1].connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('[AudioEngine] Web Audio API init failed, using standard audio output', e);
    }
  }

  public setListeners(listeners: AudioEngineListeners) {
    this.listeners = listeners;
  }

  private getActiveAudio(): HTMLAudioElement {
    return this.activeSlot === 'A' ? this.audioA : this.audioB;
  }

  private getInactiveAudio(): HTMLAudioElement {
    return this.activeSlot === 'A' ? this.audioB : this.audioA;
  }

  public async loadAndPlay(song: Song) {
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.currentTrack = song;
    const streamUrl = getStreamUrl(song.id);

    // If this song was already preloaded in the inactive slot, switch slots instantly!
    if (this.isPreloadedReady && this.preloadedTrack?.id === song.id) {
      this.swapSlots();
      const active = this.getActiveAudio();
      try {
        await active.play();
      } catch (err) {
        console.error('[AudioEngine] Failed to play preloaded track:', err);
      }
      this.isPreloadedReady = false;
      this.preloadedTrack = null;
      return;
    }

    const active = this.getActiveAudio();
    active.src = streamUrl;
    active.load();

    try {
      await active.play();
    } catch (err) {
      console.error('[AudioEngine] Failed to play track:', err);
    }
  }

  public preloadNext(song: Song) {
    if (this.preloadedTrack?.id === song.id && this.isPreloadedReady) {
      return;
    }

    this.preloadedTrack = song;
    const inactive = this.getInactiveAudio();
    inactive.src = getStreamUrl(song.id);
    inactive.preload = 'auto';
    inactive.load();
    this.isPreloadedReady = true;
  }

  public swapSlots(crossfadeDurationMs = 300) {
    const prevSlot = this.activeSlot;
    this.activeSlot = prevSlot === 'A' ? 'B' : 'A';

    const prevAudio = prevSlot === 'A' ? this.audioA : this.audioB;

    if (this.audioCtx && this.gainA && this.gainB) {
      const now = this.audioCtx.currentTime;
      const durationSec = crossfadeDurationMs / 1000;
      const prevGain = prevSlot === 'A' ? this.gainA : this.gainB;
      const nextGain = this.activeSlot === 'A' ? this.gainA : this.gainB;

      prevGain.gain.setValueAtTime(prevGain.gain.value, now);
      prevGain.gain.linearRampToValueAtTime(0, now + durationSec);

      nextGain.gain.setValueAtTime(nextGain.gain.value, now);
      nextGain.gain.linearRampToValueAtTime(1, now + durationSec);

      setTimeout(() => {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }, crossfadeDurationMs + 50);
    } else {
      prevAudio.pause();
      prevAudio.currentTime = 0;
    }
  }

  public async play() {
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    const active = this.getActiveAudio();
    if (active.src) {
      await active.play();
    }
  }

  public pause() {
    const active = this.getActiveAudio();
    active.pause();
  }

  public togglePlay() {
    const active = this.getActiveAudio();
    if (active.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seek(seconds: number) {
    const active = this.getActiveAudio();
    active.currentTime = seconds;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
    } else {
      this.audioA.volume = this.isMuted ? 0 : this.volume;
      this.audioB.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  public setEqGain(bandIndex: number, gainDb: number) {
    if (bandIndex < 0 || bandIndex >= this.eqGains.length) return;
    this.eqGains[bandIndex] = gainDb;
    if (this.eqEnabled && this.eqFilters[bandIndex] && this.audioCtx) {
      this.eqFilters[bandIndex].gain.setValueAtTime(gainDb, this.audioCtx.currentTime);
    }
  }

  public setEqEnabled(enabled: boolean) {
    this.eqEnabled = enabled;
    if (!this.audioCtx) return;
    this.eqFilters.forEach((filter, idx) => {
      filter.gain.setValueAtTime(enabled ? this.eqGains[idx] : 0, this.audioCtx!.currentTime);
    });
  }

  public applyEqPreset(preset: EqPreset) {
    preset.gains.forEach((gain, idx) => {
      this.setEqGain(idx, gain);
    });
  }

  public getCurrentTime(): number {
    return this.getActiveAudio().currentTime;
  }

  public getDuration(): number {
    return this.getActiveAudio().duration || 0;
  }

  public getCurrentTrack(): Song | null {
    return this.currentTrack;
  }
}

export const audioEngine = new AudioEngine();
