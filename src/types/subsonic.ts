export interface SubsonicResponseHeader {
  status: 'ok' | 'failed';
  version: string;
  type: string;
  serverVersion: string;
  openSubsonic?: boolean;
  error?: {
    code: number;
    message: string;
  };
}

export interface SubsonicResponseWrapper<T> {
  'subsonic-response': SubsonicResponseHeader & T;
}

export interface Song {
  id: string;
  parent?: string;
  isDir?: boolean;
  title: string;
  album?: string;
  artist?: string;
  track?: number;
  year?: number;
  genre?: string;
  coverArt?: string;
  size?: number;
  contentType?: string;
  suffix?: string;
  duration: number; // seconds
  bitRate?: number;
  path?: string;
  discNumber?: number;
  created?: string;
  albumId?: string;
  artistId?: string;
  type?: string;
  starred?: string;
  userRating?: number;
  averageRating?: number;
  playCount?: number;
  played?: string;
  artists?: Array<{ id: string; name: string }>;
  displayArtist?: string;
}

export interface Album {
  id: string;
  name: string;
  title?: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount?: number;
  duration?: number;
  created?: string;
  starred?: string;
  year?: number;
  genre?: string;
  song?: Song[];
  genres?: Array<{ name: string }>;
  artists?: Array<{ id: string; name: string }>;
  displayArtist?: string;
  releaseDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
}

export interface Artist {
  id: string;
  name: string;
  coverArt?: string;
  artistImageUrl?: string;
  albumCount?: number;
  starred?: string;
  album?: Album[];
}

export interface Playlist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number;
  created: string;
  changed: string;
  coverArt?: string;
  entry?: Song[];
}

export interface Genre {
  value: string;
  songCount: number;
  albumCount: number;
}

export interface SearchResult3 {
  song?: Song[];
  album?: Album[];
  artist?: Artist[];
}

export interface StructuredLyrics {
  artist?: string;
  title?: string;
  synced?: boolean;
  offset?: number;
  line?: Array<{
    start?: number; // milliseconds
    value: string;
  }>;
}

export interface ParsedLyricLine {
  time: number; // in seconds
  text: string;
}

export type ConnectionMode = 'LAN' | 'Tailscale' | 'Reconnecting' | 'Offline';
