# SOP / Build Prompt — "Navidify" Web App

Paste everything below into the Gemini coding agent as its initial instructions.

---

## Role & Context

You are building **Navidify**, a self-hosted personal music client that replicates Spotify's UI/UX pixel-for-pixel, but streams music from a **Navidrome** server via the **Subsonic API** instead of Spotify's backend. Build it as a **React + TypeScript** single-page application (SPA) — one HTML shell, with React Router handling navigation between views (Home, Album, Artist, Playlist, Search, etc.) without full page reloads.

This is a **standalone web app**, not the base of a shared cross-platform codebase. A native iOS/macOS app will be built separately later in Swift (for lock-screen controls, Dynamic Island, and CarPlay, none of which a web/wrapper approach can deliver) — it will not reuse this code. Optimize this app for being an excellent web app on its own terms: clean and maintainable, but don't add abstraction layers purely to keep options open for a reuse path that no longer applies.

This is a **single-user personal tool**, not a multi-tenant product. Do not build account signup, multi-user auth, or a marketing landing page.

---

## 1. Backend Integration — Navidrome / Subsonic API

- Navidrome exposes the **Subsonic API** (`/rest/*` endpoints). Use it for: library browsing (artists/albums/songs), search, streaming URLs, cover art, playlists (CRUD), starred/"liked" items, play queue, scrobble (`scrobble` endpoint, which updates Navidrome's own play counts — **do not integrate Last.fm**), and genres.
- **Auth model:** Single hardcoded connection, not a login screen. Store the following as environment variables (`.env`, gitignored, with a `.env.example` committed):
  - `VITE_NAVIDROME_URL_LAN` (e.g. `http://192.168.1.x:4533`)
  - `VITE_NAVIDROME_URL_TAILSCALE` (e.g. `http://100.x.x.x:4533`)
  - `VITE_NAVIDROME_USERNAME`
  - `VITE_NAVIDROME_PASSWORD`
- Implement Subsonic auth using the **token + salt method** (`t`/`s` params), computed client-side from the env credentials at runtime — never send the raw password on every request.
- **Automatic network detection:** both the LAN IP and the Tailscale IP are static, so the app should pick whichever is reachable without user input, rather than requiring a manual toggle:
  1. On app startup, race a lightweight health check (Subsonic's `ping.view`) against `VITE_NAVIDROME_URL_LAN` with a short timeout (~1.5s).
  2. If it succeeds, use the LAN URL as the active base URL for the session.
  3. If it times out or errors (expected when off the home network), fall back to `VITE_NAVIDROME_URL_TAILSCALE` and ping that instead.
  4. Cache the resolved base URL for the session so every subsequent request doesn't re-check. Only re-run detection if an in-flight request suddenly fails (e.g. laptop slept on Wi-Fi and woke up on cellular/another network) — treat that as a signal to re-resolve rather than surfacing a hard error immediately.
  5. Surface a small, unobtrusive indicator (or just a console log) of which connection mode is active — useful for debugging, not required in the main UI chrome.
  - Implement this as a small `resolveBaseUrl()` utility inside the Subsonic client module.
- Build a dedicated `src/api/subsonic.ts` (or module folder) that wraps all Subsonic endpoints with typed functions and typed responses (define TypeScript interfaces for Artist, Album, Song, Playlist, etc.). All other app code should talk to Navidrome only through this module — no raw fetch calls elsewhere.
- Handle Subsonic's XML **or** JSON response format — request JSON (`f=json`) explicitly.

## 2. Hosting Assumption

- The app will be **self-hosted on the same network/server as Navidrome** (LAN or reverse-proxied via something like Nginx/Caddy/Traefik), not deployed to Vercel/Netlify. Do not assume CORS is open by default — document in the README that Navidrome's reverse proxy (or Navidrome itself) needs the app's origin allowed, and build the app to work when served from a subpath if needed (relative asset paths, configurable base URL).
- Provide a `Dockerfile` and a simple `docker-compose.yml` snippet (as a comment or separate file) so it can sit next to the Navidrome container.

## 3. Visual Design — Pixel-Close Spotify Clone

Replicate Spotify's current desktop web UI as closely as possible:
- **Layout:** left sidebar (library, playlists, "Liked Songs"), top nav with back/forward + search, main content pane, right-hand "now playing"/queue panel (collapsible), bottom persistent player bar.
- **Theme:** near-black (`#121212`) background, dark gray surfaces (`#181818`/`#282828`), Spotify green accent (`#1DB954`) for primary actions/active states, white/gray text hierarchy, rounded album art with hover play-button overlay, horizontal scroll shelves for "Albums", "Artists", etc.
- **Typography:** a clean geometric sans (e.g., Inter or Circular-alternative) at similar weights/sizes to Spotify.
- **Components to replicate:** bottom player bar (album art, track/artist, like button, progress bar with scrubbing, volume slider, shuffle/repeat/prev/next/play-pause, queue toggle, lyrics toggle), sidebar navigation, search-as-you-type, album/artist/playlist detail pages with track lists, context menus (right-click) on tracks, drag-to-reorder in playlists and queue.
- Use **Tailwind CSS** for styling to move fast while keeping the design token system (colors/spacing) centralized.

## 4. Core Features (v1 scope)

**Library & browsing**
- Home (recently added/played, quick picks pulled from Navidrome data)
- Browse by Artists / Albums / Genres / Playlists
- Full-text search (debounced, across artists/albums/tracks)
- Album/Artist/Playlist detail pages with full track listings

**Playback**
- Persistent audio engine (survives navigation) using the HTML5 `<audio>` element or Web Audio API
- **Gapless playback**: preload/buffer the next track and crossfade the source swap so there's no silence gap between tracks
- **Equalizer**: Web Audio API `BiquadFilterNode` chain (e.g., 8–10 band graphic EQ) with a UI panel, presets + custom, persisted in local storage
- Queue management: play next, add to queue, reorder, shuffle, repeat (off/all/one)
- Volume control + mute, persisted between sessions

**Personal library features**
- Liked Songs (maps to Subsonic "star" endpoint)
- Playlist create/edit/delete/reorder (writes back to Navidrome via Subsonic playlist endpoints)
- Recently played (driven by scrobble/play history)

**Lyrics**
- Synced lyrics: parse embedded/companion **`.lrc`** files if present (Navidrome serves lyrics via `getLyricsBySongId` in newer Subsonic/OpenSubsonic extensions, or embedded ID3 `USLT`/`SYLT` — check what your Navidrome version exposes) and render a scrolling, time-synced lyrics view in the right-hand panel, karaoke-style highlight on the current line.
- If no `.lrc`/synced lyrics exist for a track, show a clean empty state — **do not** call any external lyrics API in v1 (explicitly out of scope per current requirements).

**Scrobbling**
- Call Subsonic's `scrobble` endpoint at the appropriate playback threshold (Spotify/Last.fm convention: ~50% played or 4 minutes, whichever comes first) so Navidrome's own play counts/history update. No third-party scrobble targets.

## 5. Architecture

- Structure the repo simply and conventionally: `src/api/` (Subsonic client), `src/player/` (playback engine + EQ), `src/state/` (global state — Zustand or Redux Toolkit, your call), `src/components/`, `src/pages/`, `src/hooks/`.
- Use React Router for navigation; keep routes RESTful/shareable (`/album/:id`, `/artist/:id`, `/playlist/:id`).
- Make this a PWA (manifest + service worker) so it can be "installed" on desktop/mobile — this is the app's own install path, not a stepping stone to a native wrapper.
- No need to abstract the player engine or API client away from browser APIs "for portability" — write them the way that's cleanest for a web app.

## 6. Deliverables

1. A working Vite + React + TypeScript project, runnable via `npm install && npm run dev`.
2. `.env.example` documenting required Navidrome connection vars.
3. `Dockerfile` + `docker-compose.yml` for self-hosting alongside Navidrome.
4. `README.md` covering: setup, env vars, reverse-proxy/CORS notes, how gapless playback and the EQ are implemented, and known limitations (e.g., no external lyrics fallback yet, single-user only).
5. Clean, typed, commented code.

## 7. Explicitly Out of Scope

- Multi-user login/accounts
- Last.fm or any third-party scrobbling
- External lyrics API fallback
- Social features (friend activity, sharing, collaborative playlists beyond basic Subsonic support)
- Native desktop/mobile builds (a separate native Swift app is planned independently, not built from this codebase)

---

Build iteratively: scaffold the project and Subsonic API client first, then the layout shell and player bar, then library/browse pages, then queue/EQ/lyrics. Confirm the Subsonic connection and basic playback work end-to-end before polishing visuals.
