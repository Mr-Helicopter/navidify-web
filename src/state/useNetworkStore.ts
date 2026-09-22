import { create } from 'zustand';
import type { ConnectionMode } from '../types/subsonic';
import { subscribeConnectionState, resolveBaseUrl, getConnectionStatus } from '../api/subsonic';

interface NetworkState {
  connectionMode: ConnectionMode;
  activeBaseUrl: string | null;
  latencyMs: number | null;
  isChecking: boolean;
  recheckConnection: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set) => {
  const initial = getConnectionStatus();

  // Subscribe to API layer connection updates
  subscribeConnectionState((mode, url) => {
    set({ connectionMode: mode, activeBaseUrl: url });
  });

  return {
    connectionMode: initial.mode,
    activeBaseUrl: initial.baseUrl,
    latencyMs: null,
    isChecking: false,

    recheckConnection: async () => {
      set({ isChecking: true, connectionMode: 'Reconnecting' });
      const startTime = performance.now();
      try {
        const url = await resolveBaseUrl(true);
        const elapsed = Math.round(performance.now() - startTime);
        const current = getConnectionStatus();
        set({
          activeBaseUrl: url,
          connectionMode: current.mode,
          latencyMs: elapsed,
          isChecking: false,
        });
      } catch (err) {
        set({
          connectionMode: 'Offline',
          latencyMs: null,
          isChecking: false,
        });
      }
    },
  };
});
