import CryptoJS from 'crypto-js';
import type {
  SubsonicResponseWrapper,
  Song,
  Album,
  Artist,
  Playlist,
  Genre,
  SearchResult3,
  StructuredLyrics,
  ParsedLyricLine,
  ConnectionMode,
} from '../types/subsonic';

const CLIENT_NAME = 'Navidify';
const API_VERSION = '1.16.1';

// Network & server state
let cachedBaseUrl: string | null = null;
let currentConnectionMode: ConnectionMode = 'Reconnecting';
let connectionListeners: Array<(mode: ConnectionMode, url: string | null) => void> = [];

export function subscribeConnectionState(listener: (mode: ConnectionMode, url: string | null) => void) {
  connectionListeners.push(listener);
  listener(currentConnectionMode, cachedBaseUrl);
  return () => {
    connectionListeners = connectionListeners.filter((l) => l !== listener);
  };
}

function notifyConnectionState(mode: ConnectionMode, url: string | null) {
  currentConnectionMode = mode;
  cachedBaseUrl = url;
  connectionListeners.forEach((l) => l(mode, url));
}

export function getConnectionStatus(): { mode: ConnectionMode; baseUrl: string | null } {
  return { mode: currentConnectionMode, baseUrl: cachedBaseUrl };
}

function getCredentials() {
  const lanUrl = (import.meta.env.VITE_NAVIDROME_URL_LAN || '').replace(/\/+$/, '');
  const tailscaleUrl = (import.meta.env.VITE_NAVIDROME_URL_TAILSCALE || '').replace(/\/+$/, '');
  const username = import.meta.env.VITE_NAVIDROME_USERNAME || '';
  const password = import.meta.env.VITE_NAVIDROME_PASSWORD || '';
  return { lanUrl, tailscaleUrl, username, password };
}

export function buildAuthParams() {
  const { username, password } = getCredentials();
  const salt = Math.random().toString(36).substring(2, 12);
  const token = CryptoJS.MD5(password + salt).toString();
  return {
    u: username,
    t: token,
    s: salt,
    v: API_VERSION,
    c: CLIENT_NAME,
    f: 'json',
  };
}

async function pingUrl(baseUrl: string, timeoutMs: number = 1500): Promise<boolean> {
  if (!baseUrl) return false;
  const auth = buildAuthParams();
  const params = new URLSearchParams(auth);
  const url = `${baseUrl}/rest/ping.view?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const json: SubsonicResponseWrapper<unknown> = await res.json();
    return json['subsonic-response']?.status === 'ok';
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function resolveBaseUrl(forceRecheck = false): Promise<string> {
  if (!forceRecheck && cachedBaseUrl) {
    return cachedBaseUrl;
  }

  notifyConnectionState('Reconnecting', cachedBaseUrl);
  const { lanUrl, tailscaleUrl } = getCredentials();

  // 1. Race LAN ping with 1.5s timeout
  if (lanUrl) {
    const lanOk = await pingUrl(lanUrl, 1500);
    if (lanOk) {
      console.log(`[Navidify] Connected via LAN (${lanUrl})`);
      notifyConnectionState('LAN', lanUrl);
      return lanUrl;
    }
  }

  // 2. Fall back to Tailscale
  if (tailscaleUrl) {
    const tsOk = await pingUrl(tailscaleUrl, 3000);
    if (tsOk) {
      console.log(`[Navidify] Connected via Tailscale (${tailscaleUrl})`);
      notifyConnectionState('Tailscale', tailscaleUrl);
      return tailscaleUrl;
    }
  }

  // If neither ping succeeded, try whichever exists or throw
  const fallback = tailscaleUrl || lanUrl;
  if (fallback) {
    console.warn(`[Navidify] Health check timed out, attempting fallback: ${fallback}`);
    notifyConnectionState('Offline', fallback);
    return fallback;
  }

  notifyConnectionState('Offline', null);
  throw new Error('No Navidrome server URLs configured in .env');
}

export async function subsonicFetch<T>(
  endpoint: string,
  extraParams: Record<string, string | number | boolean | undefined> = {},
  isRetry = false
): Promise<T> {
  const baseUrl = await resolveBaseUrl(false);
  const auth = buildAuthParams();
  const params = new URLSearchParams({
    ...auth,
    ...Object.fromEntries(
      Object.entries(extraParams)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ),
  });

  const fullUrl = `${baseUrl}/rest/${endpoint}?${params.toString()}`;

  try {
    const res = await fetch(fullUrl);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    const data: SubsonicResponseWrapper<T> = await res.json();
    const resp = data['subsonic-response'];

    if (resp.status !== 'ok') {
      throw new Error(resp.error?.message || `Subsonic request failed for ${endpoint}`);
    }

    return resp as T;
  } catch (err) {
    // If request failed and we haven't retried yet, re-resolve base URL (e.g. WiFi switched)
    if (!isRetry) {
      console.warn(`[Navidify] Request to ${endpoint} failed. Re-evaluating network connection...`);
      await resolveBaseUrl(true);
      return subsonicFetch<T>(endpoint, extraParams, true);
    }
    throw err;
  }
}

export function getStreamUrl(songId: string): string {
  const baseUrl = cachedBaseUrl || getCredentials().tailscaleUrl || getCredentials().lanUrl;
  const auth = buildAuthParams();
  const params = new URLSearchParams({
    ...auth,
    id: songId,
  });
  return `${baseUrl}/rest/stream.view?${params.toString()}`;
}

export function getCoverArtUrl(id?: string, size = 300): string {
  if (!id) return '';
  const baseUrl = cachedBaseUrl || getCredentials().tailscaleUrl || getCredentials().lanUrl;
  const auth = buildAuthParams();
  const params = new URLSearchParams({
    ...auth,
    id,
    size: String(size),
  });
  return `${baseUrl}/rest/getCoverArt.view?${params.toString()}`;
}

export function getArtistImageUrl(id?: string, size = 300): string {
  if (!id) return '';
  const baseUrl = cachedBaseUrl || getCredentials().tailscaleUrl || getCredentials().lanUrl;
  const auth = buildAuthParams();
  const params = new URLSearchParams({
    ...auth,
    id,
    size: String(size),
  });
  return `${baseUrl}/rest/getAvatar.view?${params.toString()}`;
}

// Subsonic API methods
export const api = {
  ping: () => subsonicFetch<unknown>('ping.view'),

  getAlbumList2: (
    type: 'frequent' | 'recent' | 'newest' | 'starred' | 'random' | 'alphabeticalByName' | 'byGenre' | 'byYear' = 'newest',
    size = 20,
    offset = 0,
    genre?: string
  ) =>
    subsonicFetch<{ albumList2: { album?: Album[] } }>('getAlbumList2.view', {
      type,
      size,
      offset,
      genre,
    }),

  getArtists: () =>
    subsonicFetch<{ artists: { index?: Array<{ name: string; artist?: Artist[] }> } }>('getArtists.view'),

  getArtist: (id: string) =>
    subsonicFetch<{ artist: Artist & { album?: Album[] } }>('getArtist.view', { id }),

  getAlbum: (id: string) =>
    subsonicFetch<{ album: Album & { song?: Song[] } }>('getAlbum.view', { id }),

  getGenres: () =>
    subsonicFetch<{ genres: { genre?: Genre[] } }>('getGenres.view'),

  getStarred2: () =>
    subsonicFetch<{ starred2: { song?: Song[]; album?: Album[]; artist?: Artist[] } }>('getStarred2.view'),

  star: (id: string, type: 'song' | 'album' | 'artist' = 'song') => {
    const paramKey = type === 'album' ? 'albumId' : type === 'artist' ? 'artistId' : 'id';
    return subsonicFetch<unknown>('star.view', { [paramKey]: id });
  },

  unstar: (id: string, type: 'song' | 'album' | 'artist' = 'song') => {
    const paramKey = type === 'album' ? 'albumId' : type === 'artist' ? 'artistId' : 'id';
    return subsonicFetch<unknown>('unstar.view', { [paramKey]: id });
  },

  search3: (query: string) =>
    subsonicFetch<{ searchResult3: SearchResult3 }>('search3.view', {
      query,
      artistCount: 10,
      albumCount: 15,
      songCount: 20,
    }),

  getPlaylists: () =>
    subsonicFetch<{ playlists: { playlist?: Playlist[] } }>('getPlaylists.view'),

  getPlaylist: (id: string) =>
    subsonicFetch<{ playlist: Playlist & { entry?: Song[] } }>('getPlaylist.view', { id }),

  createPlaylist: (name: string, songIds: string[] = []) =>
    subsonicFetch<{ playlist: Playlist }>('createPlaylist.view', {
      name,
      songId: songIds.length > 0 ? songIds.join(',') : undefined,
    }),

  updatePlaylist: (
    playlistId: string,
    name?: string,
    comment?: string,
    publicPlay?: boolean,
    songIdsToAdd?: string[],
    songIndexesToRemove?: number[]
  ) =>
    subsonicFetch<unknown>('updatePlaylist.view', {
      playlistId,
      name,
      comment,
      public: publicPlay,
      songIdToAdd: songIdsToAdd && songIdsToAdd.length > 0 ? songIdsToAdd.join(',') : undefined,
      songIndexToRemove:
        songIndexesToRemove && songIndexesToRemove.length > 0 ? songIndexesToRemove.join(',') : undefined,
    }),

  deletePlaylist: (id: string) =>
    subsonicFetch<unknown>('deletePlaylist.view', { id }),

  scrobble: (id: string, submission = true) =>
    subsonicFetch<unknown>('scrobble.view', { id, submission }),

  getLyricsBySongId: (id: string) =>
    subsonicFetch<{ lyricsList?: { structuredLyrics?: StructuredLyrics[] } }>('getLyricsBySongId.view', { id }),

  getLyrics: (artist?: string, title?: string) =>
    subsonicFetch<{ lyrics?: { value?: string } }>('getLyrics.view', { artist, title }),

  startScan: (fullScan = false) =>
    subsonicFetch<{ scanStatus: { scanning: boolean } }>('startScan.view', { fullScan }),

  getScanStatus: () =>
    subsonicFetch<{ scanStatus: { scanning: boolean; count: number; folderCount: number } }>('getScanStatus.view'),
};

let navidromeJwtToken: string | null = null;
let jwtTokenExpiry = 0;

export async function getNavidromeToken(): Promise<string | null> {
  const now = Date.now();
  if (navidromeJwtToken && now < jwtTokenExpiry) {
    return navidromeJwtToken;
  }

  const baseUrl = await resolveBaseUrl(false);
  const { username, password } = getCredentials();
  if (!username || !password) return null;

  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      navidromeJwtToken = data.token;
      jwtTokenExpiry = now + 12 * 3600 * 1000;
      return navidromeJwtToken;
    }
  } catch (err) {
    console.warn('[Navidify] Native Navidrome login error:', err);
  }
  return null;
}

export async function syncFoldersToPlaylists(): Promise<void> {
  const token = await getNavidromeToken();
  if (!token) return;

  const baseUrl = await resolveBaseUrl(false);
  const headers = {
    'x-nd-authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch existing playlists in Navidrome
    const existingPlaylistsRes = await fetch(`${baseUrl}/api/playlist`, { headers });
    if (!existingPlaylistsRes.ok) return;
    const existingPlaylists: Array<{ id: string; name: string }> = await existingPlaylistsRes.json();
    const existingNames = new Set(existingPlaylists.map((p) => p.name.trim().toLowerCase()));

    // 2. Fetch songs to detect distinct directory names
    const songsRes = await fetch(`${baseUrl}/api/song?_start=0&_end=5000`, { headers });
    if (!songsRes.ok) return;
    const songs: Array<{ path?: string }> = await songsRes.json();

    const distinctFolders = new Set<string>();
    songs.forEach((s) => {
      if (s.path && s.path.includes('/')) {
        const parts = s.path.split('/');
        const topFolder = parts[0].trim();
        if (topFolder && topFolder !== '.') {
          distinctFolders.add(topFolder);
        }
      }
    });

    // 3. For any folder that doesn't have a playlist yet, create a Smart Playlist
    for (const folder of distinctFolders) {
      if (!existingNames.has(folder.toLowerCase())) {
        console.log(`[Navidify] Auto-creating smart playlist for folder: "${folder}"`);
        const payload = {
          name: folder,
          comment: `Auto-synced from folder '${folder}'`,
          rules: {
            all: [{ contains: { filepath: folder } }],
          },
        };

        await fetch(`${baseUrl}/api/playlist`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }
    }
  } catch (err) {
    console.warn('[Navidify] Folder sync error:', err);
  }
}

export function parseLrc(lrcText: string): ParsedLyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: ParsedLyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\](.*)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millisStr = match[3] || '0';
      const millis = parseInt(millisStr.padEnd(3, '0').substring(0, 3), 10);
      const time = minutes * 60 + seconds + millis / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}
