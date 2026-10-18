import type { Song } from '../types/subsonic';
import { getCoverArtUrl } from '../api/subsonic';

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
}

let isInitialized = false;

export function initMediaSession(handlers: MediaSessionHandlers) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  if (isInitialized) return;

  try {
    navigator.mediaSession.setActionHandler('play', () => handlers.onPlay());
    navigator.mediaSession.setActionHandler('pause', () => handlers.onPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => handlers.onPrevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => handlers.onNextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) {
        handlers.onSeek(details.seekTime);
      }
    });

    // Explicitly unregister seekbackward and seekforward
    // so macOS displays Next/Previous Track buttons in Control Center & top bar
    try {
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    } catch {
      // Ignored if browser does not support clearing
    }

    isInitialized = true;
  } catch (err) {
    console.warn('[MediaSession] Failed to set action handlers:', err);
  }
}

export function updateMediaSessionMetadata(track: Song | null) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }

  const artwork = track.coverArt
    ? [
        { src: getCoverArtUrl(track.coverArt, 128), sizes: '128x128', type: 'image/jpeg' },
        { src: getCoverArtUrl(track.coverArt, 256), sizes: '256x256', type: 'image/jpeg' },
        { src: getCoverArtUrl(track.coverArt, 512), sizes: '512x512', type: 'image/jpeg' },
      ]
    : [];

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      album: track.album || '',
      artwork,
    });
  } catch (err) {
    console.warn('[MediaSession] Failed to update metadata:', err);
  }
}

export function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  } catch (err) {
    console.warn('[MediaSession] Failed to update playbackState:', err);
  }
}

export function updateMediaSessionPosition(currentTime: number, duration: number) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  if (
    'setPositionState' in navigator.mediaSession &&
    duration > 0 &&
    Number.isFinite(duration) &&
    Number.isFinite(currentTime)
  ) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, duration),
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch {
      // Silently catch out-of-bounds timing race conditions
    }
  }
}
