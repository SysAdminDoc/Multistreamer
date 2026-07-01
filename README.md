# MultiStream

A self-hosted, real-time multi-video streaming viewer with chat, perfect for watch parties, storm tracking, event monitoring, and more.

![MultiStream](https://img.shields.io/badge/version-v0.30.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![No Backend](https://img.shields.io/badge/backend-none-orange)

<img width="1914" height="909" alt="2026-01-25 14_48_41-MultiStream Viewer - Chromium" src="https://github.com/user-attachments/assets/1d417314-5c49-48f6-8cee-d6328b4f04a3" />

# Create your own room here:
https://sysadmindoc.github.io/Multistreamer/


## Features

- **Multi-Video Grid** - Watch multiple YouTube, Twitch, Rumble, HLS, DASH, and allowlisted iframe embeds in a responsive Brady Bunch-style grid
- **Twitch Chat Sidecar** - Twitch channels render with embedded live chat beside the player
- **Featured Layout** - Highlight one main video with smaller sidebar streams
- **Manual Grid Presets** - Sync auto, 1+2, 2+3, 3+1, or custom CSS grid column layouts
- **Pop-Out Streams** - Open any stream in a floating local picture-in-picture panel while keeping the main grid visible
- **Audio Mix Sliders** - Adjust each stream from 0-100 instead of only toggling mute
- **Real-Time Sync** - All viewers see the same streams, layout, and settings instantly
- **Sync Health** - Relay status, retry recovery, stale-viewer filtering, and copyable diagnostics
- **Leader Election** - If the real host disappears, active viewers deterministically elect a temporary host
- **Chat Moderation** - Hosts can kick or ban chat participants using stable local moderation tokens
- **Chat Rate Controls** - Synced slow-mode and per-user message windows reduce spam during busy rooms
- **YouTube LiveChat Mirror** - Hosts can locally poll YouTube LiveChat and merge those messages into room chat
- **Weather Overlay Providers** - Add synced Windy, Zoom Earth, Ventusky, or LightningMaps overlays by location
- **NWS Incident Alerts** - Fetch active National Weather Service alerts and pin the highest-priority alert as a synced ticker
- **Stream Minimap** - Add per-stream geo-tags and show synced camera markers on a compact minimap
- **Persistence Mirror** - Push/pull room snapshots to optional Supabase or Firebase REST backends
- **Ephemeral Reactions** - Viewers can send synced cheer, heart, fire, and wow reactions that float over the stream grid
- **Chat Export** - Download visible chat history as JSON or TXT without exposing moderation tokens
- **Native Playback Sync** - Host-clock calibrated HLS/DASH playback nudges viewers toward a shared rolling live-buffer delay, mirrors host scrubs, and supports per-stream offsets
- **Provider Health** - Player adapter health snapshots, HLS/DASH recovery, iframe reloads, and per-stream controls
- **Accessible Field UI** - Labelled controls, semantic dialogs, focus-safe modals, and compact mobile headers
- **Localization-Ready UI** - Visible app copy and chat timestamps flow through a message catalog and locale-aware formatter
- **Live Chat** - Built-in chat room synced across all viewers
- **Host Controls** - Only hosts can add/remove streams; viewers just watch
- **No Backend Required** - Uses Gun.js for P2P sync, works on static hosting (GitHub Pages)
- **Room Creator** - Create unlimited rooms without editing any files
- **Customizable** - Themes, colors, labels, announcements, and more

## Quick Start

### Deploy to GitHub Pages

1. **Fork or clone this repository**

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (or `master`), folder: `/ (root)`
   - Save

3. **Access your site**
   - Your URL will be: `https://yourusername.github.io/repository-name/`

### Create Your First Room

1. Visit your deployed site (no URL parameters)
2. Fill in:
   - **Room name**: `my-watch-party` (URL-friendly, lowercase)
   - **Room title**: `My Awesome Watch Party!` (displayed to viewers)
   - **Host password**: Your secret key (auto-generated if left blank)
3. Click **Create Room**
4. Copy your **Host Link** (keep private!) and **Viewer Link** (share publicly!)

## Usage

### As a Host

Access your room with the host link:
```
https://yoursite.github.io/?room=my-room&host=yourSecretPassword
```

**Controls available:**
| Control | Description |
|---------|-------------|
| Add Stream | Paste YouTube, Twitch, Rumble, HLS, DASH, or `iframe:` allowlisted embed URL and click Add |
| Set Main | Make a video the featured/large video |
| Label | Give streams custom names |
| Offset | Add a per-stream latency offset for native HLS/DASH sync correction |
| Geo | Add a per-stream latitude/longitude marker for the minimap |
| Pop Out | Open one stream in a floating local picture-in-picture panel |
| Volume Slider | Mix each stream from 0-100; host changes sync to viewers |
| Mute/Unmute All | Set all stream volumes to 0 or 100 |
| Weather | Add a Windy, Zoom Earth, Ventusky, or LightningMaps overlay panel |
| Fetch NWS Alerts | Pin the highest-priority active NWS alert for the configured weather coordinates |
| Persistence Mirror | Save local Supabase/Firebase REST settings and push/pull room snapshots |
| Settings | Customize theme, colors, layout |
| Share | Get viewer/host links |
| Diagnostics | Copy room, relay, browser, and stream health data with host keys redacted |
| Kick/Ban | Remove a chat participant temporarily or ban their browser token from the room |
| Clear | Remove all streams |

**Room Management:**
- Click the room title to edit it (syncs to all viewers)
- Set an announcement message in Settings
- Export your config to save/reuse setups

### As a Viewer

Access with the viewer link:
```
https://yoursite.github.io/?room=my-room
```

Viewers can:
- Watch all streams the host has added
- Mute/unmute individual videos locally
- Participate in chat
- See real-time updates when host makes changes

Viewers cannot:
- Add or remove streams
- Change layout or settings
- Edit room title or announcements

## URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `room` | Room identifier (required for viewing) | `room=blizzard-2025` |
| `host` | Host password (enables host controls) | `host=mySecretKey` |

**Examples:**
```
# Room creator (no params)
https://yoursite.github.io/

# Viewer mode
https://yoursite.github.io/?room=storm-watch

# Host mode
https://yoursite.github.io/?room=storm-watch&host=abc123
```

## Features in Detail

### Layouts

- **Grid** - Equal-sized tiles, auto-arranges based on stream count
- **Featured** - One large main video + sidebar with remaining streams
- **Manual grid presets** - Hosts can choose Auto, 1+2, 2+3, 3+1, or a custom `grid-template-columns` value in synced Settings

### Synced Settings

All these sync in real-time to viewers:
- Room title & announcement
- Streams (add/remove/order)
- Mute states
- Stream volume levels
- Stream geo-tags for minimap markers
- Layout mode & featured video
- Grid preset and custom grid columns
- Custom stream labels
- Theme & accent color
- Grid gap & label visibility
- Weather overlay provider & location
- Pinned NWS incident alert text

### Sync Health and Diagnostics

- The top bar shows relay health as Connecting, Synced, Reconnecting, or Offline.
- Presence counts ignore stale sessions after 60 seconds so disconnected viewers do not remain counted as live.
- When the public relay disconnects, the app retries the configured relay list automatically.
- If no real host presence is fresh, active viewers choose the same temporary host by session ID until a real host returns.
- The Diagnostics button copies a JSON bundle with app version, room ID, redacted room URL, relay state, retry history, playback-sync samples, provider counts, provider health snapshots, browser media support, and recent runtime/HLS/DASH errors.

### Playback Sync

- Hosts publish a lightweight sync heartbeat every 5 seconds with a rolling clock sample and native HLS/DASH playback-buffer measurements.
- Viewers use the rolling host-clock offset plus their own HLS/DASH latency samples to seek or gently adjust playback rate toward an 8-second live-buffer target.
- Host HLS/DASH scrubs publish a separate sync event so viewers seek to the same media timestamp when that timestamp is still seekable.
- Per-stream offsets can add or subtract up to 30 seconds from native HLS/DASH sync targets to compensate for provider latency differences.
- HLS uses hls.js live-latency data when available and falls back to the media element buffer range.
- DASH uses dash.js live-latency data when available and falls back to the media element buffer range.
- YouTube, Twitch, Rumble, and generic iframe embeds stay on the shared room-state sync path; browser iframe isolation does not expose their media timelines for direct seek/rate correction.

### Pop-Out Streams

- The Pop Out control opens the selected stream in a floating 16:9 panel over the room.
- Pop-out playback is local to the current browser tab; it does not change the synced grid layout or force other viewers to pop the stream out.
- HLS and DASH pop-outs use native video controls and inherit the stream volume/mute state when opened.
- Closing the panel destroys the mounted player so it does not keep playing in the background.

### Provider Health and Recovery

- YouTube, Twitch, Rumble, HLS, DASH, and allowlisted iframe embeds mount through small provider adapters with `mount`, `destroy`, `mute`, `health`, and `reload` hooks.
- HLS fatal network and media errors show an in-tile recovery strip and attempt hls.js recovery before falling back to a manual reload control.
- DASH manifests use vendored dash.js with low-latency live settings, health snapshots, and manual reload recovery.
- Iframe providers expose the same adapter surface for health, reload, and diagnostics; HLS/DASH additionally support direct playback sync correction.

### Accessibility and Mobile

- Primary forms, settings, chat inputs, generated links, and modal fields have labels or ARIA names.
- Share, announcement, import, and label dialogs expose modal semantics, trap focus, close with Escape, and restore focus to the opener.
- The mobile top bar gives the room title its own row and keeps sync diagnostics, viewer count, and status controls within the 390px field viewport.

### Supported Stream Sources

- YouTube watch, Live, Shorts, embed, `youtu.be`, or raw 11-character video IDs
- Twitch channel URLs with video plus chat sidecar
- Twitch VOD URLs (`twitch.tv/videos/...`)
- Direct Rumble embed URLs (`rumble.com/embed/v.../`)
- Direct HLS playlist URLs ending in `.m3u8`
- MPEG-DASH manifests ending in `.mpd`
- Explicit `iframe:` or `embed:` URLs for allowlisted providers: Windy, Ventusky, LightningMaps, Zoom Earth, Vimeo, Google Calendar, and Google Maps embed URLs

### Chat

- Usernames saved locally
- Messages sync in real-time
- Host messages highlighted with badge
- Host-only Kick and Ban controls appear beside viewer chat messages.
- Kicks expire after 10 minutes; bans persist for that browser's local moderation token.
- Moderated browsers stop counting as active viewers, cannot chat, and cannot become elected temporary hosts.
- Hosts can sync slow-mode seconds plus per-user message count/window limits from Settings.
- Hosts can save a YouTube Data API key locally and mirror the featured or first YouTube stream's LiveChat into room chat.
- YouTube API keys stay in local browser storage; only mirrored message text, author name, timestamp, and source tag sync to viewers.
- Reaction buttons send short-lived cheer, heart, fire, and wow stickers that float over the grid for active viewers.
- Header JSON/TXT buttons export the visible two-hour chat history without session or moderation tokens.
- 2-hour message history
- Collapsible bottom bar (doesn't cover videos)

### Weather Panel

- Choose Windy radar, Zoom Earth radar, Ventusky precipitation, or LightningMaps live overlays
- Configurable lat/lon coordinates
- Fetch active NWS alerts for the same coordinates and pin the highest-priority alert as a scrolling incident strip
- Great for storm tracking!

### Themes

- **Dark** - Default dark theme
- **Midnight** - Deep blue tones
- **AMOLED** - Pure black for OLED screens

### Import/Export

Save your room configuration as JSON:
```json
{
  "version": 13,
  "room": "my-room",
  "streams": [
    { "id": "dQw4w9WgXcQ", "type": "youtube", "sourceId": "dQw4w9WgXcQ", "sourceKind": "video", "muted": true, "volume": 0, "label": "Main Camera", "latencyOffsetMs": 0, "geo": { "lat": 40.7128, "lon": -74.006 } },
    { "id": "twitch-stormwatch", "type": "twitch", "sourceId": "stormwatch", "sourceKind": "channel", "muted": true, "label": "Storm Watch" },
    { "id": "rumble-v1io41", "type": "rumble", "sourceId": "v1io41", "sourceKind": "embed", "muted": true, "label": "Rumble Clip" },
    { "id": "hls-mwizu8", "type": "hls", "sourceId": "https://example.com/live/camera.m3u8", "sourceKind": "playlist", "muted": true, "label": "HLS Camera" },
    { "id": "dash-f2s7am", "type": "dash", "sourceId": "https://example.com/live/manifest.mpd", "sourceKind": "manifest", "muted": true, "label": "DASH Feed" },
    { "id": "iframe-8y4a2b", "type": "iframe", "sourceId": "https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5", "sourceKind": "embed", "muted": true, "label": "Windy Embed" }
  ],
  "settings": {
    "layout": "featured",
    "featuredId": "dQw4w9WgXcQ",
    "grid": { "preset": "custom", "customTemplate": "minmax(0, 2fr) minmax(220px, 1fr)" },
    "weather": { "enabled": true, "provider": "windy", "lat": 40.7128, "lon": -74.006 },
    "incident": { "enabled": true, "event": "Flood Warning", "severity": "Severe", "text": "Severe Flood Warning | Flood Warning issued for the area | Areas: Example County | Until Jan 1, 12:00 PM", "updatedAt": 1893456000000, "expiresAt": "2030-01-01T12:00:00-05:00" },
    "chat": { "slowModeSeconds": 5, "rateLimitCount": 5, "rateLimitSeconds": 30 },
    "display": { "gridGap": 2, "labels": "hover", "theme": "dark", "accent": "#00d4ff" }
  }
}
```

Import configs to quickly set up similar events.

Imported configs are validated before they change the room:
- Future config versions are rejected with an update message.
- Stream records are normalized through the same source parser used by the Add Stream control.
- Invalid stream records are skipped and reported after import.
- Stream volumes are range-checked from 0 to 100.
- Per-stream latency offsets are range-checked to +/-30 seconds.
- Per-stream geo-tags are range-checked to latitude -90..90 and longitude -180..180.
- Grid presets and custom CSS grid columns are validated before sync.
- Chat slow-mode and rate-limit settings are range-checked before sync.
- Incident alert text and timestamps are normalized before sync.
- Layout, featured stream, weather provider/coordinates, display labels, theme, grid gap, and accent colors are range-checked before sync.

### Localization

- Static UI labels, placeholders, button text, toast copy, validation messages, and generated control labels use the in-page message catalog.
- Chat timestamps are formatted through one locale-aware formatter so future language packs do not need to touch chat rendering code.

## Technical Details

### How It Works

MultiStream uses [Gun.js](https://gun.eco/) for decentralized, real-time data sync:
- No server/database required
- Data syncs via public relay servers
- Relay health is visible in the top bar, and stale viewer sessions expire automatically
- Works on any static hosting (GitHub Pages, Netlify, etc.)
- Room state persists even when host disconnects

### Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

For local Twitch testing, serve the folder from `localhost` instead of opening `index.html` directly so Twitch embed `parent` validation can pass.

### Dependencies

- [Gun.js](https://gun.eco/) - Decentralized database (vendored locally)
- [Twitch Embeds](https://dev.twitch.tv/docs/embed/) - Twitch player and chat iframes
- [Rumble](https://rumble.com/) - Direct video embed iframes
- [hls.js](https://github.com/video-dev/hls.js/) - HLS playback in browsers without native HLS support (vendored locally)
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js/) - MPEG-DASH manifest playback with low-latency live settings (vendored locally)
- [Windy.com](https://windy.com/), [Zoom Earth](https://zoom.earth/), [Ventusky](https://www.ventusky.com/), and [LightningMaps](https://www.lightningmaps.org/) - Weather, radar, and lightning overlays
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api) - Active alert data

### Local Testing

```bash
npm install
npm test
```

The test suite covers parser contracts plus a Playwright-rendered workflow for host add/remove, viewer-mode controls, import validation, export downloads, modal focus behavior, and 390px mobile header layout. External YouTube playback is stubbed in the rendered test so local results do not depend on provider availability.

### Embed Security

- Third-party video, chat, and weather iframes include titles, lazy loading, referrer policy, and sandbox policies.
- Generic iframe embeds require an explicit `iframe:` or `embed:` prefix and must match the built-in provider allowlist before they are saved or rendered.
- Runtime JavaScript libraries are loaded from pinned local files in `vendor/` instead of unpinned CDN URLs.

### Privacy

- No data stored on your server
- Room data stored on Gun.js relay network
- Optional YouTube API keys are stored only in the host browser's local storage
- Chat messages expire after 2 hours
- No analytics or tracking
- Optional Supabase/Firebase mirror keys are stored only in the host browser's local storage

## Self-Hosting Gun Relay (Optional)

For better reliability, run the included Dockerized Gun relay on a small VPS, LAN host, or reverse-proxied home server.

```bash
cd relay
docker compose up -d --build
```

The container exposes the relay at:

```text
http://localhost:8765/gun
```

For public rooms, put the container behind HTTPS and update `GUN_RELAYS` in `index.html` before deploying the static site:

```javascript
const GUN_RELAYS = [
  'https://your-relay.example.com/gun',
  'https://gun.o8.is/gun'
];
```

Operational commands:

```bash
cd relay
docker compose ps
docker compose logs -f
docker compose pull && docker compose up -d --build
```

## Supabase / Firebase Persistence Mirror (Optional)

The Settings panel can mirror the current room config to a durable backend without replacing Gun's realtime sync path. Provider URL and key/token values stay in the host browser's local storage.

### Supabase

Create a `room_snapshots` table and expose it through Supabase's REST API:

```sql
create table if not exists public.room_snapshots (
  room_id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);
```

Use the Supabase project URL as the endpoint, for example:

```text
https://your-project.supabase.co
```

Use an anon key with Row Level Security policies that match your room-sharing model. Do not paste a service role key into the browser.

### Firebase Realtime Database

Use the database root URL as the endpoint:

```text
https://your-project-default-rtdb.firebaseio.com
```

The app stores snapshots under:

```text
/multistreamer/rooms/<room-id>
```

Use Firebase rules or an auth token that only grants the rooms you intend to mirror. The mirror pushes the same validated JSON config used by Import/Export and can pull it back into the room when the Gun relay has lost state.

## Use Cases

- **Storm/Weather Tracking** - Multiple news streams + radar
- **Sports Watch Parties** - Multiple game angles or broadcasts  
- **Security Monitoring** - Multiple camera feeds
- **Event Coverage** - News streams during breaking events
- **Gaming** - Multiple Twitch/YouTube gaming streams
- **Conference Rooms** - Display multiple video sources

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - feel free to use, modify, and distribute.

## Acknowledgments

- [Gun.js](https://gun.eco/) for the amazing decentralized sync
- [Windy.com](https://windy.com/), [Zoom Earth](https://zoom.earth/), [Ventusky](https://www.ventusky.com/), and [LightningMaps](https://www.lightningmaps.org/) for embeddable weather maps
- Inspired by the need to watch multiple blizzard streams at once!

---

**Made for storm chasers, sports fans, and anyone who needs to watch ALL the streams.**
