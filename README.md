# Navidify Web

**Navidify** is a personal, self-hosted web music client that replicates Spotify's desktop web UI pixel-for-pixel, streaming music directly from your [Navidrome](https://www.navidrome.org/) music server via the Subsonic API.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + Web Audio API**.

---

## Features

- **Spotify Desktop Web UI**:
  - Dark theme with Spotify tokens (`#121212`, `#181818`, `#282828`, `#1DB954`).
  - Left navigation sidebar with expandable Library, Liked Songs shortcut, and custom playlists.
  - Collapsible right-hand panel for Queue and Now Playing specs.
  - Sticky top navigation with back/forward history, integrated search bar, and user profile badge.
  - Bottom persistent player bar with artwork, scrubbing seekbar, volume control, and quick action icons.
- **Audio Engine & Gapless Playback**:
  - Dual HTML5 Audio elements routed into a Web Audio API graph (`AudioContext` -> `MediaElementAudioSourceNode` -> 10-band `BiquadFilterNode` EQ -> `GainNode` -> `Destination`).
  - Instant progressive HTTP range streaming without downloading entire lossless FLAC/MP3 files into RAM.
  - Automatic preloading of the next queued track in the inactive audio slot during the last 15 seconds of playback.
  - Smooth gain crossfading on track boundaries.
- **10-Band Graphic Equalizer**:
  - ISO center frequencies: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
  - Accessible via the sliders icon in the player bar.
  - Curated genre presets (Flat, Bass Boost, Bass Reducer, Treble Boost, Vocal Boost, Rock, Pop, Electronic, Classical, Jazz, Acoustic) + custom manual tuning.
  - Persistent gain settings and bypass toggle saved in LocalStorage.
- **Automatic Network Detection (LAN vs. Tailscale)**:
  - Startup ping race against `VITE_NAVIDROME_URL_LAN` (~1.5s timeout).
  - Automatic fallback to `VITE_NAVIDROME_URL_TAILSCALE` if off the home network.
  - Cached session base URL with automatic re-resolution on in-flight connection drop.
  - Subtle status indicator badge in the sidebar with live latency display and one-click manual recheck.
- **Subsonic API Integration**:
  - Secure token + salt authentication (`t = md5(password + salt)`).
  - Explicit JSON payload request format (`f=json`).
  - Native Navidrome scrobbling (`scrobble` endpoint triggered at 50% or 4 minutes played).
  - Starred / Liked songs synchronization (`star` and `unstar` endpoints).
  - Playlist management (create, rename, delete, add tracks).
  - Full-text debounced search across songs, albums, and artists.
- **Synced Karaoke Lyrics**:
  - Synchronized scrolling lyrics parsed from OpenSubsonic `getLyricsBySongId` or `.lrc` tags.
  - Immersive full-screen karaoke view with live active line highlighting.
- **PWA Ready**:
  - Web app manifest and service worker shell for desktop or mobile installation.

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node 22 or 24 recommended)
- A running [Navidrome](https://www.navidrome.org/) instance

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Navidrome details:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Local Area Network URL (e.g. your home server IP on port 4533)
VITE_NAVIDROME_URL_LAN=http://192.168.1.50:4533

# Tailscale Static IP or VPN URL (used automatically when away from home)
VITE_NAVIDROME_URL_TAILSCALE=http://100.x.y.z:4533

# Navidrome Subsonic Credentials
VITE_NAVIDROME_USERNAME=your_username
VITE_NAVIDROME_PASSWORD=your_password
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Reverse Proxy & CORS Configuration

If you host Navidify on a different port or domain from Navidrome, you must ensure Navidrome allows CORS requests from Navidify:

### Option A: Navidrome Environment Variable
In your `docker-compose.yml` for Navidrome or `navidrome.toml`:
```yaml
environment:
  - ND_REVERSEPROXYUSERHEADER=Remote-User
  - ND_SUBSONICARTISTPARTICIPATION=true
```

### Option B: Nginx / Caddy Reverse Proxy
If running behind Nginx, ensure headers are passed:
```nginx
location /rest/ {
    proxy_pass http://navidrome:4533;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
}
```

---

## Self-Hosting with Docker

A production multi-stage Docker build is included with an optimized Nginx Alpine web server:

```bash
docker compose up -d --build
```

The container exposes Navidify on port `3000`.

---

## Audio Architecture Details

1. **Range Requests**: Audio files are streamed via progressive HTTP range requests using the HTML5 `<audio>` element. This prevents multi-megabyte lossless FLAC or 320kbps MP3 tracks from having to be loaded completely into memory before playback can begin.
2. **Audio Graph Routing**: Both primary and secondary audio elements are connected to `MediaElementAudioSourceNode` instances in an `AudioContext`.
3. **Filter Chain**: Audio passes through 10 cascaded `BiquadFilterNode` instances representing ISO center frequencies from 31Hz up to 16kHz, with adjustable gain from -12dB to +12dB.
4. **Gapless Handoff**: When track progress exceeds 85% or enters the last 15 seconds, the secondary slot loads the next track's stream URL with `preload="auto"`. At track boundary, gains ramp smoothly and playback switches slots with zero delay.

---

## Explicitly Out of Scope (v1)

- Multi-user authentication/accounts (designed as a single-user personal tool).
- Third-party scrobblers (Last.fm / ListenBrainz) — Navidrome's native play counts are used.
- External lyrics APIs (only embedded `.lrc` and Subsonic/OpenSubsonic server lyrics are rendered).
