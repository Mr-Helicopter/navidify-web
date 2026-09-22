import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '../types/subsonic';
import { audioEngine } from '../player/audioEngine';
import { EQ_PRESETS } from '../player/eqPresets';
import { api } from '../api/subsonic';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentTrack: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  queueIndex: number;
  history: Song[];
  shuffle: boolean;
  repeatMode: RepeatMode;
  hasScrobbledCurrent: boolean;

  // EQ state
  eqEnabled: boolean;
  eqGains: number[];
  activeEqPreset: string;

  // UI Panels
  isRightPanelOpen: boolean;
  rightPanelTab: 'queue' | 'nowPlaying';
  isLyricsOpen: boolean;
  isEqModalOpen: boolean;

  // Actions
  playTrack: (song: Song, contextQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setEqGain: (band: number, gain: number) => void;
  setEqPreset: (presetName: string) => void;
  toggleEq: (enabled?: boolean) => void;
  toggleRightPanel: (tab?: 'queue' | 'nowPlaying') => void;
  toggleLyrics: () => void;
  toggleEqModal: (open?: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      queue: [],
      queueIndex: -1,
      history: [],
      shuffle: false,
      repeatMode: 'off',
      hasScrobbledCurrent: false,

      eqEnabled: true,
      eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      activeEqPreset: 'Flat',

      isRightPanelOpen: false,
      rightPanelTab: 'nowPlaying',
      isLyricsOpen: false,
      isEqModalOpen: false,

      playTrack: async (song: Song, contextQueue?: Song[]) => {
        let newQueue = get().queue;
        let newIndex = 0;

        if (contextQueue && contextQueue.length > 0) {
          newQueue = [...contextQueue];
          newIndex = newQueue.findIndex((s) => s.id === song.id);
          if (newIndex === -1) {
            newQueue.unshift(song);
            newIndex = 0;
          }
        } else {
          // If song is not in current queue, prepend or append
          const existingIdx = newQueue.findIndex((s) => s.id === song.id);
          if (existingIdx !== -1) {
            newIndex = existingIdx;
          } else {
            newQueue = [song, ...newQueue];
            newIndex = 0;
          }
        }

        set({
          currentTrack: song,
          queue: newQueue,
          queueIndex: newIndex,
          currentTime: 0,
          duration: song.duration || 0,
          isPlaying: true,
          isLoading: true,
          hasScrobbledCurrent: false,
        });

        // Initialize audio engine settings
        audioEngine.setVolume(get().volume);
        audioEngine.setMuted(get().isMuted);
        audioEngine.setEqEnabled(get().eqEnabled);
        get().eqGains.forEach((gain, idx) => audioEngine.setEqGain(idx, gain));

        await audioEngine.loadAndPlay(song);
      },

      togglePlay: () => {
        const { currentTrack, isPlaying } = get();
        if (!currentTrack) return;

        if (isPlaying) {
          audioEngine.pause();
          set({ isPlaying: false });
        } else {
          audioEngine.play();
          set({ isPlaying: true });
        }
      },

      seek: (seconds: number) => {
        audioEngine.seek(seconds);
        set({ currentTime: seconds });
      },

      nextTrack: async () => {
        const { queue, queueIndex, repeatMode, shuffle, currentTrack } = get();
        if (queue.length === 0) return;

        if (currentTrack) {
          set((state) => ({ history: [currentTrack, ...state.history].slice(0, 50) }));
        }

        if (repeatMode === 'one' && currentTrack) {
          audioEngine.seek(0);
          audioEngine.play();
          set({ currentTime: 0, hasScrobbledCurrent: false });
          return;
        }

        let nextIdx = queueIndex + 1;
        if (shuffle && queue.length > 1) {
          let rand = Math.floor(Math.random() * queue.length);
          while (rand === queueIndex && queue.length > 1) {
            rand = Math.floor(Math.random() * queue.length);
          }
          nextIdx = rand;
        }

        if (nextIdx >= queue.length) {
          if (repeatMode === 'all') {
            nextIdx = 0;
          } else {
            audioEngine.pause();
            set({ isPlaying: false, currentTime: 0 });
            return;
          }
        }

        const nextSong = queue[nextIdx];
        if (nextSong) {
          set({
            queueIndex: nextIdx,
            currentTrack: nextSong,
            currentTime: 0,
            duration: nextSong.duration || 0,
            hasScrobbledCurrent: false,
            isLoading: true,
          });
          await audioEngine.loadAndPlay(nextSong);
        }
      },

      prevTrack: async () => {
        const { currentTime, queue, queueIndex } = get();
        // If > 3 seconds in, restart track
        if (currentTime > 3) {
          audioEngine.seek(0);
          set({ currentTime: 0 });
          return;
        }

        const prevIdx = queueIndex - 1;
        if (prevIdx >= 0 && queue[prevIdx]) {
          const prevSong = queue[prevIdx];
          set({
            queueIndex: prevIdx,
            currentTrack: prevSong,
            currentTime: 0,
            duration: prevSong.duration || 0,
            hasScrobbledCurrent: false,
            isLoading: true,
          });
          await audioEngine.loadAndPlay(prevSong);
        } else {
          audioEngine.seek(0);
          set({ currentTime: 0 });
        }
      },

      addToQueue: (song: Song) => {
        set((state) => ({ queue: [...state.queue, song] }));
      },

      playNext: (song: Song) => {
        set((state) => {
          const newQueue = [...state.queue];
          const insertIdx = state.queueIndex + 1;
          newQueue.splice(insertIdx, 0, song);
          return { queue: newQueue };
        });
      },

      removeFromQueue: (index: number) => {
        set((state) => {
          const newQueue = state.queue.filter((_, idx) => idx !== index);
          let newIndex = state.queueIndex;
          if (index < state.queueIndex) {
            newIndex--;
          }
          return { queue: newQueue, queueIndex: newIndex };
        });
      },

      reorderQueue: (startIndex: number, endIndex: number) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(startIndex, 1);
          newQueue.splice(endIndex, 0, removed);

          let newIndex = state.queueIndex;
          if (state.queueIndex === startIndex) {
            newIndex = endIndex;
          } else if (startIndex < state.queueIndex && endIndex >= state.queueIndex) {
            newIndex--;
          } else if (startIndex > state.queueIndex && endIndex <= state.queueIndex) {
            newIndex++;
          }

          return { queue: newQueue, queueIndex: newIndex };
        });
      },

      clearQueue: () => {
        const { currentTrack } = get();
        set({
          queue: currentTrack ? [currentTrack] : [],
          queueIndex: currentTrack ? 0 : -1,
        });
      },

      setVolume: (vol: number) => {
        audioEngine.setVolume(vol);
        set({ volume: vol, isMuted: false });
      },

      toggleMute: () => {
        const newMuted = !get().isMuted;
        audioEngine.setMuted(newMuted);
        set({ isMuted: newMuted });
      },

      toggleShuffle: () => {
        set((state) => ({ shuffle: !state.shuffle }));
      },

      toggleRepeat: () => {
        set((state) => {
          const modes: RepeatMode[] = ['off', 'all', 'one'];
          const next = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
          return { repeatMode: next };
        });
      },

      setEqGain: (band: number, gain: number) => {
        audioEngine.setEqGain(band, gain);
        set((state) => {
          const newGains = [...state.eqGains];
          newGains[band] = gain;
          return { eqGains: newGains, activeEqPreset: 'Custom' };
        });
      },

      setEqPreset: (presetName: string) => {
        const preset = EQ_PRESETS[presetName];
        if (preset) {
          audioEngine.applyEqPreset(preset);
          set({ activeEqPreset: preset.name, eqGains: [...preset.gains] });
        }
      },

      toggleEq: (enabled?: boolean) => {
        const target = enabled !== undefined ? enabled : !get().eqEnabled;
        audioEngine.setEqEnabled(target);
        set({ eqEnabled: target });
      },

      toggleRightPanel: (tab?: 'queue' | 'nowPlaying') => {
        set((state) => {
          if (tab && state.isRightPanelOpen && state.rightPanelTab === tab) {
            return { isRightPanelOpen: false };
          }
          return {
            isRightPanelOpen: tab ? true : !state.isRightPanelOpen,
            rightPanelTab: tab || state.rightPanelTab,
          };
        });
      },

      toggleLyrics: () => {
        set((state) => ({ isLyricsOpen: !state.isLyricsOpen }));
      },

      toggleEqModal: (open?: boolean) => {
        set((state) => ({ isEqModalOpen: open !== undefined ? open : !state.isEqModalOpen }));
      },
    }),
    {
      name: 'navidify-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        eqEnabled: state.eqEnabled,
        eqGains: state.eqGains,
        activeEqPreset: state.activeEqPreset,
        shuffle: state.shuffle,
        repeatMode: state.repeatMode,
      }),
    }
  )
);

// Bind AudioEngine callbacks into store
audioEngine.setListeners({
  onTimeUpdate: (currentTime, duration) => {
    const state = usePlayerStore.getState();
    usePlayerStore.setState({ currentTime, duration: duration || state.duration });

    // Scrobble check: 50% played or 4 minutes (240s)
    if (!state.hasScrobbledCurrent && state.currentTrack && duration > 0) {
      if (currentTime >= duration * 0.5 || currentTime >= 240) {
        usePlayerStore.setState({ hasScrobbledCurrent: true });
        api.scrobble(state.currentTrack.id, true).catch((e) => {
          console.warn('[Navidify] Scrobble failed:', e);
        });
      }
    }

    // Preload next track if within last 15s or 85%
    if (duration > 0 && (duration - currentTime < 15 || currentTime / duration > 0.85)) {
      const nextIdx = state.queueIndex + 1;
      if (nextIdx < state.queue.length) {
        const nextSong = state.queue[nextIdx];
        if (nextSong) {
          audioEngine.preloadNext(nextSong);
        }
      }
    }
  },
  onPlay: () => {
    usePlayerStore.setState({ isPlaying: true, isLoading: false });
  },
  onPause: () => {
    usePlayerStore.setState({ isPlaying: false });
  },
  onLoading: (isLoading) => {
    usePlayerStore.setState({ isLoading });
  },
  onEnded: () => {
    usePlayerStore.getState().nextTrack();
  },
  onError: (err) => {
    console.error('[AudioEngine] Playback error:', err);
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
  },
});
