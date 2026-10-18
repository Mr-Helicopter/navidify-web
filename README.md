# Navidify Web

**Navidify** is a personal, self-hosted music streaming app for anyone running Navidrome. I basically did this because I found it difficult to move from Spotify to any other app, so this is literally Spotify WebUI, except the backend is your Navidrome server.

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

# Tailscale Static IP or VPN URL (switches automatically if your home address is unreachable)
VITE_NAVIDROME_URL_TAILSCALE=http://100.x.y.z:4533

# Your navidrome server username and password
VITE_NAVIDROME_USERNAME=your_username
VITE_NAVIDROME_PASSWORD=your_password
```

### 3. Run Development Server
```bash
npm run dev
```

Then open localhost:3000 on your browser! Or whatever your IP address is.

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

If you prefer using Docker, that's all set too:

```bash
docker compose up -d --build
```

Also runs on port `3000`.

---

## I used AI to help in this project.

I'm not much of a coder myself, so AI definitely helped me more than a lot here.
