# MultiStream

A self-hosted, real-time multi-video streaming viewer with chat, perfect for watch parties, storm tracking, event monitoring, and more.

![MultiStream](https://img.shields.io/badge/version-v0.12.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![No Backend](https://img.shields.io/badge/backend-none-orange)

<img width="1914" height="909" alt="2026-01-25 14_48_41-MultiStream Viewer - Chromium" src="https://github.com/user-attachments/assets/1d417314-5c49-48f6-8cee-d6328b4f04a3" />

# Create your own room here:
https://sysadmindoc.github.io/Multistreamer/


## Features

- **Multi-Video Grid** - Watch multiple YouTube, Twitch, Rumble, HLS, and DASH streams in a responsive Brady Bunch-style grid
- **Twitch Chat Sidecar** - Twitch channels render with embedded live chat beside the player
- **Featured Layout** - Highlight one main video with smaller sidebar streams
- **Real-Time Sync** - All viewers see the same streams, layout, and settings instantly
- **Sync Health** - Relay status, retry recovery, stale-viewer filtering, and copyable diagnostics
- **Provider Health** - Player adapter health snapshots, HLS/DASH recovery, and per-stream reload controls
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
| Add Stream | Paste YouTube, Twitch, Rumble, HLS, or DASH URL and click Add |
| Set Main | Make a video the featured/large video |
| Label | Give streams custom names |
| Mute/Unmute All | Control audio for all streams |
| Weather | Add a Windy.com radar panel |
| Settings | Customize theme, colors, layout |
| Share | Get viewer/host links |
| Diagnostics | Copy room, relay, browser, and stream health data with host keys redacted |
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

### Synced Settings

All these sync in real-time to viewers:
- Room title & announcement
- Streams (add/remove/order)
- Mute states
- Layout mode & featured video
- Custom stream labels
- Theme & accent color
- Grid gap & label visibility
- Weather panel & location

### Sync Health and Diagnostics

- The top bar shows relay health as Connecting, Synced, Reconnecting, or Offline.
- Presence counts ignore stale sessions after 60 seconds so disconnected viewers do not remain counted as live.
- When the public relay disconnects, the app retries the configured relay list automatically.
- The Diagnostics button copies a JSON bundle with app version, room ID, redacted room URL, relay state, retry history, provider counts, provider health snapshots, browser media support, and recent runtime/HLS/DASH errors.

### Provider Health and Recovery

- YouTube, Twitch, Rumble, HLS, and DASH streams mount through small provider adapters with `mount`, `destroy`, `mute`, `health`, and `reload` hooks.
- HLS fatal network and media errors show an in-tile recovery strip and attempt hls.js recovery before falling back to a manual reload control.
- DASH manifests use vendored dash.js with low-latency live settings, health snapshots, and manual reload recovery.
- Iframe providers expose the same adapter surface so playback-sync and provider-specific health work can build on one contract.

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

### Chat

- Usernames saved locally
- Messages sync in real-time
- Host messages highlighted with badge
- 2-hour message history
- Collapsible bottom bar (doesn't cover videos)

### Weather Panel

- Powered by Windy.com embeds
- Shows radar/precipitation overlay
- Configurable lat/lon coordinates
- Great for storm tracking!

### Themes

- **Dark** - Default dark theme
- **Midnight** - Deep blue tones
- **AMOLED** - Pure black for OLED screens

### Import/Export

Save your room configuration as JSON:
```json
{
  "version": 5,
  "room": "my-room",
  "streams": [
    { "id": "dQw4w9WgXcQ", "type": "youtube", "sourceId": "dQw4w9WgXcQ", "sourceKind": "video", "muted": true, "label": "Main Camera" },
    { "id": "twitch-stormwatch", "type": "twitch", "sourceId": "stormwatch", "sourceKind": "channel", "muted": true, "label": "Storm Watch" },
    { "id": "rumble-v1io41", "type": "rumble", "sourceId": "v1io41", "sourceKind": "embed", "muted": true, "label": "Rumble Clip" },
    { "id": "hls-mwizu8", "type": "hls", "sourceId": "https://example.com/live/camera.m3u8", "sourceKind": "playlist", "muted": true, "label": "HLS Camera" },
    { "id": "dash-f2s7am", "type": "dash", "sourceId": "https://example.com/live/manifest.mpd", "sourceKind": "manifest", "muted": true, "label": "DASH Feed" }
  ],
  "settings": {
    "layout": "featured",
    "featuredId": "dQw4w9WgXcQ",
    "weather": { "enabled": true, "lat": 40.7128, "lon": -74.006 },
    "display": { "gridGap": 2, "labels": "hover", "theme": "dark", "accent": "#00d4ff" }
  }
}
```

Import configs to quickly set up similar events.

Imported configs are validated before they change the room:
- Future config versions are rejected with an update message.
- Stream records are normalized through the same source parser used by the Add Stream control.
- Invalid stream records are skipped and reported after import.
- Layout, featured stream, weather coordinates, display labels, theme, grid gap, and accent colors are range-checked before sync.

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
- [Windy.com](https://windy.com/) - Weather radar embeds

### Local Testing

```bash
npm install
npm test
```

The test suite covers parser contracts plus a Playwright-rendered workflow for host add/remove, viewer-mode controls, import validation, export downloads, modal focus behavior, and 390px mobile header layout. External YouTube playback is stubbed in the rendered test so local results do not depend on provider availability.

### Embed Security

- Third-party video, chat, and weather iframes include titles, lazy loading, referrer policy, and sandbox policies.
- Runtime JavaScript libraries are loaded from pinned local files in `vendor/` instead of unpinned CDN URLs.

### Privacy

- No data stored on your server
- Room data stored on Gun.js relay network
- Chat messages expire after 2 hours
- No analytics or tracking

## Self-Hosting Gun Relay (Optional)

For better reliability, you can run your own Gun relay:

```bash
npm install gun
npx gun
```

Then update the Gun initialization in the HTML:
```javascript
const gun = Gun(['https://your-relay-server.com/gun']);
```

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
- [Windy.com](https://windy.com/) for embeddable weather maps
- Inspired by the need to watch multiple blizzard streams at once!

---

**Made for storm chasers, sports fans, and anyone who needs to watch ALL the streams.**
