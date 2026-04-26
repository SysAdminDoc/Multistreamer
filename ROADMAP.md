# Roadmap

Static web app for multi-video YouTube grid viewing with P2P-synced host/viewer state via Gun.js. Roadmap targets platform reach, more robust sync, and event-tracking-specific features.

## Planned Features

### Source Expansion
- Twitch embed support (via Twitch IFrame API) with chat-sidecar
- Kick / Rumble / YouTube Live all-in-one
- RTSP/HLS .m3u8 direct embed for security-camera use case
- DASH manifest support for lower-latency live
- Generic `<iframe>` allowlist for user-supplied embeds

### Sync & Latency
- NTP-calibrated playback sync (delay each player by rolling average of viewer buffers)
- Scrub sync: host scrubs → all viewers seek to same timestamp
- Latency offset per-stream (compensate for Twitch 2s vs YouTube 8s lag)
- Leader-election for when host drops out (viewer quorum chooses new host)

### Layout & Controls
- Manual grid layouts (1+2, 2+3, 3+1, custom CSS grid template)
- Per-stream audio mix slider instead of binary mute
- Pop-out mode: open a single stream in a floating picture-in-picture
- Keyboard shortcuts: 1-9 to focus a stream, `M` to mute all, `F` featured

### Chat & Moderation
- Host ban / kick with moderation tokens
- Emote / sticker reactions with ephemeral overlay
- Chat history export (JSON/TXT)
- Slow-mode and per-user rate limits
- YouTube LiveChat mirror into the built-in chat (merge feeds)

### Weather / Overlays
- Configurable overlay iframes beyond Windy (RadarScope-lite, Ventusky, lightning live)
- Incident overlay: pinned NWS alert text scroll
- Camera markers on a small minimap tied to each stream's geo-tag

### Deployment & Persistence
- Optional self-hosted Gun relay deployment guide with Docker
- Firebase / Supabase alternative backend for persistence guarantees
- Room passwords (hash) so viewer URL doesn't leak host access
- Scheduled rooms: auto-activate at a time and auto-close after N hours

## Competitive Research
- **MultiTwitch.tv** — simplest reference UX, low friction; borrow the URL-based room pattern.
- **LiveStreamPool** — better multi-source integration (mixed platforms in one grid).
- **Blackmagic ATEM / vMix** — studio-grade multi-source mixing; borrow "Program/Preview" metaphor for featured.
- **Watch2Gether** — playlist queue + chat + sync; closer to watch-party angle.

## Nice-to-Haves
- Mobile-optimized 1-column scroll with floating featured
- Offline-first PWA with cached Gun.js data
- Audio-only mode (strips video, just mixes audio streams — radio scanner style)
- Timeline / clip mode: bookmark timestamps, export shareable links to key moments
- Stats overlay: concurrent viewers per stream from public APIs
- Integration with OBS browser source (send full grid as one composited feed)

## Open-Source Research (Round 2)

### Related OSS Projects
- https://github.com/LordKnish/StreamGrid — cross-platform (Win/macOS/Linux) drag-drop grid, supports YouTube/Twitch/RTSP/HLS/MPEG-DASH/local files
- https://github.com/pjmagee/multi-stream-viewer — Blazor WebAssembly, Twitch + YouTube + Kick
- https://github.com/Worsttrumpet/MultiStream-Grid — browser multistream viewer, Twitch/Kick/YouTube
- https://github.com/ilanzgx/multistream — Electron desktop, integrated chat per stream
- https://github.com/VenomousRhyme41/Multi-Stream-Viewer — up to 4 streams, theater mode
- https://github.com/smitch88/multi-stream-twitch — React/Redux/ImmutableJS reference architecture
- https://github.com/kree-nickm/better-multi-twitch — snap-to-grid window manager (archived, read for ideas only)

### Features to Borrow
- RTSP/RTSPS + HLS + MPEG-DASH source support in addition to YouTube (StreamGrid) — unlocks IP camera feeds, weather radar loops, storm-chaser streams for the original use case
- Per-stream integrated chat (ilanzgx/multistream) — MultiStream has one room chat, add per-source chat tabs as an option
- Theater mode / distraction-free full-bleed grid (VenomousRhyme41) — one keystroke hides all chrome
- Vertical-monitor layout presets (pjmagee/multi-stream-viewer) — 1×N column layout for ultrawide/vertical displays
- Snap-to-grid free window placement as alternative to fixed grid (better-multi-twitch) — power user mode
- Kick.com support alongside YouTube (all listed OSS viewers) — Kick is now mainstream, users request it
- URL-based room sharing with encoded layout state (StreamGrid) — MultiStream has Gun.js rooms, add link-only ephemeral rooms
- Local file / RTSP ingestion for watch-parties of personal media (StreamGrid) — expands beyond YouTube-only use case

### Patterns & Architectures Worth Studying
- Gun.js P2P vs WebRTC mesh for layout sync — MultiStream uses Gun.js which works on static hosting; compare against self-hosted WebSocket for paid-tier features
- Blazor WASM approach (pjmagee) — alternative stack if the Gun.js sync becomes unreliable at scale
- Redux/ImmutableJS time-travel debugging (smitch88) — useful for replaying host-state changes during moderation disputes
- Per-stream iframe sandbox with `allow-scripts allow-same-origin` denied (security pattern) — prevents a malicious embed from tracking viewers across streams
