import { useEffect } from 'react';
import { usePlayerStore } from '../state/usePlayerStore';

export function useKeyboardShortcuts() {
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLyrics,
    currentTime,
    duration,
    volume,
  } = usePlayerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Never hijack shortcuts when user is typing in form inputs, textareas, or search boxes
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Space: Play / Pause toggle
      if (e.code === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Skip Next Track: Cmd+Right / Ctrl+Right or Shift+Right
      if (((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') || (e.shiftKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        nextTrack();
        return;
      }

      // Skip Previous Track: Cmd+Left / Ctrl+Left or Shift+Left
      if (((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') || (e.shiftKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        prevTrack();
        return;
      }

      // Plain Arrow Keys: Seek +/- 5 seconds
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
        return;
      }
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
        return;
      }

      // Arrow Up / Down: Volume control (by 5%)
      if (e.key === 'ArrowUp' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setVolume(Math.min(1, Math.round((volume + 0.05) * 100) / 100));
        return;
      }
      if (e.key === 'ArrowDown' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setVolume(Math.max(0, Math.round((volume - 0.05) * 100) / 100));
        return;
      }

      // M: Mute toggle
      if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleMute();
        return;
      }

      // L: Lyrics toggle
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleLyrics();
        return;
      }

      // S: Shuffle toggle
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      // R: Repeat toggle
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleRepeat();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLyrics,
    currentTime,
    duration,
    volume,
  ]);
}
