import { create } from 'zustand';
import type { Playlist, Song, Album } from '../types/subsonic';
import { api, syncFoldersToPlaylists } from '../api/subsonic';

interface LibraryState {
  playlists: Playlist[];
  starredSongIds: Set<string>;
  starredAlbumIds: Set<string>;
  starredArtistIds: Set<string>;
  starredSongs: Song[];
  isLoadingPlaylists: boolean;
  isLoadingStarred: boolean;
  isSyncingFolders: boolean;

  fetchPlaylists: () => Promise<void>;
  scanAndSyncLibrary: () => Promise<void>;
  fetchStarred: () => Promise<void>;
  toggleStarSong: (song: Song) => Promise<void>;
  toggleStarAlbum: (album: Album) => Promise<void>;
  createPlaylist: (name: string, songIds?: string[]) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songIndex: number) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  playlists: [],
  starredSongIds: new Set(),
  starredAlbumIds: new Set(),
  starredArtistIds: new Set(),
  starredSongs: [],
  isLoadingPlaylists: false,
  isLoadingStarred: false,
  isSyncingFolders: false,

  fetchPlaylists: async () => {
    set({ isLoadingPlaylists: true });
    try {
      // Auto-sync folder playlists from Navidrome server
      await syncFoldersToPlaylists().catch(() => {});
      const res = await api.getPlaylists();
      set({ playlists: res.playlists.playlist || [], isLoadingPlaylists: false });
    } catch (err) {
      console.error('[LibraryStore] Failed to fetch playlists:', err);
      set({ isLoadingPlaylists: false });
    }
  },

  scanAndSyncLibrary: async () => {
    set({ isSyncingFolders: true });
    try {
      // 1. Tell Navidrome to scan media directory for newly created folders/files
      await api.startScan(false).catch(() => {});
      // Wait for Navidrome scan step
      await new Promise((resolve) => setTimeout(resolve, 1800));
      // 2. Discover new folders and generate smart playlists
      await syncFoldersToPlaylists().catch(() => {});
      // 3. Update state
      const res = await api.getPlaylists();
      set({ playlists: res.playlists.playlist || [], isSyncingFolders: false });
    } catch (err) {
      console.error('[LibraryStore] scanAndSyncLibrary error:', err);
      set({ isSyncingFolders: false });
    }
  },

  fetchStarred: async () => {
    set({ isLoadingStarred: true });
    try {
      const res = await api.getStarred2();
      const starred = res.starred2;
      const songs = starred.song || [];
      const albums = starred.album || [];
      const artists = starred.artist || [];

      set({
        starredSongs: songs,
        starredSongIds: new Set(songs.map((s) => s.id)),
        starredAlbumIds: new Set(albums.map((a) => a.id)),
        starredArtistIds: new Set(artists.map((ar) => ar.id)),
        isLoadingStarred: false,
      });
    } catch (err) {
      console.error('[LibraryStore] Failed to fetch starred items:', err);
      set({ isLoadingStarred: false });
    }
  },

  toggleStarSong: async (song: Song) => {
    const isStarred = get().starredSongIds.has(song.id);
    const newSet = new Set(get().starredSongIds);

    if (isStarred) {
      newSet.delete(song.id);
      set({
        starredSongIds: newSet,
        starredSongs: get().starredSongs.filter((s) => s.id !== song.id),
      });
      try {
        await api.unstar(song.id, 'song');
      } catch {
        // Rollback
        newSet.add(song.id);
        set({ starredSongIds: newSet });
      }
    } else {
      newSet.add(song.id);
      set({
        starredSongIds: newSet,
        starredSongs: [song, ...get().starredSongs],
      });
      try {
        await api.star(song.id, 'song');
      } catch {
        // Rollback
        newSet.delete(song.id);
        set({ starredSongIds: newSet });
      }
    }
  },

  toggleStarAlbum: async (album: Album) => {
    const isStarred = get().starredAlbumIds.has(album.id);
    const newSet = new Set(get().starredAlbumIds);

    if (isStarred) {
      newSet.delete(album.id);
      set({ starredAlbumIds: newSet });
      try {
        await api.unstar(album.id, 'album');
      } catch {
        newSet.add(album.id);
        set({ starredAlbumIds: newSet });
      }
    } else {
      newSet.add(album.id);
      set({ starredAlbumIds: newSet });
      try {
        await api.star(album.id, 'album');
      } catch {
        newSet.delete(album.id);
        set({ starredAlbumIds: newSet });
      }
    }
  },

  createPlaylist: async (name: string, songIds: string[] = []) => {
    try {
      const res = await api.createPlaylist(name, songIds);
      await get().fetchPlaylists();
      return res.playlist;
    } catch (err) {
      console.error('[LibraryStore] Failed to create playlist:', err);
      return null;
    }
  },

  deletePlaylist: async (id: string) => {
    try {
      await api.deletePlaylist(id);
      set({ playlists: get().playlists.filter((p) => p.id !== id) });
    } catch (err) {
      console.error('[LibraryStore] Failed to delete playlist:', err);
    }
  },

  addSongToPlaylist: async (playlistId: string, songId: string) => {
    try {
      await api.updatePlaylist(playlistId, undefined, undefined, undefined, [songId]);
      await get().fetchPlaylists();
    } catch (err) {
      console.error('[LibraryStore] Failed to add song to playlist:', err);
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songIndex: number) => {
    try {
      await api.updatePlaylist(playlistId, undefined, undefined, undefined, undefined, [songIndex]);
      await get().fetchPlaylists();
    } catch (err) {
      console.error('[LibraryStore] Failed to remove song from playlist:', err);
    }
  },
}));
