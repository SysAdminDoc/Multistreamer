# Changelog

All notable changes to Multistreamer will be documented in this file.

## [v0.38.1] - 2026-09-14

- Fixed compound room settings so imported schedules, weather, incidents, and stats apply immediately and synchronize field by field.
- Fixed empty stream location fields being interpreted as latitude 0 and longitude 0.
- Added a configurable relay list for private and test deployments.
- Replaced the weather-specific icon with a production Multistreamer identity and complete PWA icon set.
- Added verified desktop, settings, and mobile screenshots with clearly labelled sample data.
- Rebuilt the README around the hosted app, self-hosting path, supported sources, privacy behavior, and Ko-fi support link.
- Archived the previous identity, five reviewed directions, source artwork, and raw captures under `assets/concepts/`.

## [v0.38.0] - 2026-07-01

- Added: OBS browser-source mode via `?obs=1` for a clean full-viewport composited grid.
- Added: Share modal OBS Browser Source link generation.
- Added: Static and rendered regression coverage for OBS mode chrome hiding and viewport fill.

## [v0.37.0] - 2026-07-01

- Added: Optional synced stats overlay with host-refreshed public viewer-count badges for supported YouTube and Twitch streams.
- Added: Config v16 import/export validation for `settings.stats.enabled` and `settings.stats.refreshSeconds`.
- Added: Rendered regression coverage for enabling stats and displaying a YouTube live viewer-count badge.

## [v0.36.0] - 2026-07-01

- Added: Synced timeline clip bookmarks with shareable `?clip=` room links.
- Added: Clip JSON export with room id, stream labels, wall-clock timestamps, media time when available, and share URLs.
- Added: Static and rendered regression coverage for creating and exporting clip bookmarks.

## [v0.35.0] - 2026-07-01

- Added: Synced audio-only display mode with compact stream mixer cards.
- Added: Config v15 import/export validation for `settings.display.audioOnly`.
- Added: Rendered regression coverage for toggling audio-only mode and restoring the video grid.

## [v0.34.0] - 2026-07-01

- Added: Installable PWA shell with manifest and service-worker app-shell caching.
- Added: Per-room local offline cache that hydrates validated stream/settings snapshots before Gun reconnects.
- Added: Static and rendered regression coverage for service-worker wiring and cached room snapshots.

## [v0.33.0] - 2026-07-01

- Added: Mobile featured layout now uses a one-column scroll surface with a sticky featured stream.
- Added: Rendered 390px mobile assertions for sticky featured layout and sidebar stacking.

## [v0.32.0] - 2026-07-01

- Added: Synced room schedules with start time, duration, active, scheduled, and closed states.
- Added: Public viewer gating for scheduled and closed rooms, including chat/reaction blocking until live.
- Added: Config v14 import/export validation for `settings.schedule`.

## [v0.31.0] - 2026-07-01

- Added: Host password hashing with room-scoped SHA-256 metadata storage.
- Changed: Host URLs strip `host=` from the address bar after successful access and reuse the locally stored key.
- Changed: Legacy plaintext `meta.hostKey` rooms migrate to `meta.hostKeyHash` on the next successful host login.

## [v0.30.0] - 2026-06-30

- Added: Optional Supabase/Firebase persistence mirror controls in Settings.
- Added: Manual push/pull of validated room config snapshots through REST APIs.
- Changed: Persistence provider URLs and keys are stored only in the host browser local storage.

## [v0.29.0] - 2026-06-30

- Added: Optional Dockerized Gun relay package under `relay/`.
- Added: Docker Compose health check and persistent Gun data volume.
- Changed: README self-hosting instructions now use the included relay package instead of runtime `npx gun` setup.

## [v0.28.0] - 2026-06-30

- Added: Per-stream geo-tag editor with latitude/longitude validation.
- Added: Synced stream minimap with accessible camera markers.
- Added: Config v13 import/export support for stream `geo` tags.

## [v0.27.0] - 2026-06-30

- Added: Host-triggered NWS active alert fetch for the configured weather coordinates.
- Added: Synced pinned incident alert ticker with highest-priority NWS alert text.
- Added: Config v12 import/export validation for `settings.incident`.

## [v0.26.0] - 2026-06-30

- Added: Synced weather overlay provider selection for Windy, Zoom Earth, Ventusky, and LightningMaps.
- Added: Config v11 import/export validation for `settings.weather.provider`.
- Changed: The Weather panel now labels and renders the selected provider instead of assuming Windy.

## [v0.25.0] - 2026-06-30

- Added: Optional host-side YouTube LiveChat mirror using a locally stored YouTube Data API key.
- Added: Mirrored YouTube chat source tags in built-in chat and exports.
- Changed: The mirror publishes only message text, author name, timestamp, and source metadata into room chat.

## [v0.24.0] - 2026-06-30

- Added: Synced chat slow-mode and per-user rate-limit settings.
- Added: Config v10 import/export validation for `settings.chat`.
- Changed: Non-host chat sends are locally throttled by the synced chat limits.

## [v0.23.0] - 2026-06-30

- Added: Chat history export buttons for JSON and TXT.
- Added: Shared browser download helper for config and chat exports.
- Changed: Chat exports omit session ids and moderation tokens.

## [v0.22.0] - 2026-06-30

- Added: Synced ephemeral reaction buttons for cheer, heart, fire, and wow.
- Added: Floating reaction overlay above the stream grid with short-lived animation.
- Changed: Moderated viewers are also blocked from sending reactions.

## [v0.21.0] - 2026-06-30

- Added: Host-only chat Kick and Ban controls backed by stable local moderation tokens.
- Added: Moderated viewer blocking overlay, disabled chat input, offline presence state, and leader-election exclusion.
- Added: Rendered workflow coverage for host banning a viewer from chat.

## [v0.20.0] - 2026-06-30

- Added: Per-stream Pop Out control that opens any source in a floating local picture-in-picture panel.
- Added: Rendered workflow coverage for opening and closing a YouTube pop-out.
- Changed: Closing a pop-out now destroys the mounted provider instance so playback does not continue in the background.

## [v0.19.0] - 2026-06-30

- Added: Per-stream 0-100 audio mix sliders in stream tile controls.
- Added: Config v9 import/export support and validation for stream `volume`.
- Changed: HLS/DASH adapters now apply actual media volume; iframe providers sync volume state and use mute-at-zero behavior.

## [v0.18.0] - 2026-06-30

- Added: Synced manual grid layout presets for Auto, 1+2, 2+3, 3+1, and custom CSS grid columns.
- Added: Config v8 import/export validation for `settings.grid`.
- Changed: Grid rendering now applies explicit preset item placement while preserving featured layout behavior.

## [v0.17.0] - 2026-06-30

- Added: Presence-based leader election that promotes a deterministic temporary host when real host presence expires.
- Added: Leader election diagnostics with current leader, quorum size, check cadence, and recent election events.
- Changed: Host-only room controls, playback sync ownership, imports, settings, and chat host badges now honor elected host control state.

## [v0.16.0] - 2026-06-30

- Added: Per-stream latency offset controls with +/-30 second validation.
- Added: Config v7 import/export support for `latencyOffsetMs`.
- Changed: Native HLS/DASH playback sync now applies stream offsets to target delay and exposes them in diagnostics.

## [v0.15.0] - 2026-06-30

- Added: Host scrub sync events for native HLS/DASH streams.
- Added: Viewer seek application with seekable-range checks, pending scrub queueing, and scrub diagnostics.
- Changed: Playback sync docs now cover both live-buffer correction and host scrub mirroring.

## [v0.14.0] - 2026-06-30

- Added: Host-clock playback sync heartbeat for native HLS/DASH streams.
- Added: Rolling live-buffer latency samples, viewer seek/rate correction, and playback-sync diagnostics.
- Changed: README now documents native playback sync behavior and iframe timeline limits.

## [v0.13.0] - 2026-06-30

- Added: Explicit `iframe:` / `embed:` source parsing for built-in allowlisted providers.
- Added: Generic iframe provider adapter wiring, sandbox/referrer policies, rendered workflow coverage, and config export version 6.
- Changed: Source input copy and README docs now describe the allowlisted iframe model.

## [v0.12.0] - 2026-06-30

- Added: MPEG-DASH `.mpd` manifest parsing and normalized stream records.
- Added: Vendored dash.js runtime with a DASH provider adapter, low-latency live settings, health snapshots, and reload recovery.
- Changed: Room config export version is now 5 and source copy/docs include DASH alongside HLS.

## [v0.11.0] - 2026-06-28

- Added: In-page message catalog for setup, viewer, settings, modal, toast, validation, and generated control copy.
- Added: Locale-aware chat timestamp formatter shared by all chat message rendering.
- Added: Static tests that enforce translation-key coverage and block inline chat time formatting regressions.

## [v0.10.0] - 2026-06-28

- Added: Versioned room config import validation for streams, settings, weather, display, and future config versions.
- Changed: Config export now uses the shared `CONFIG_VERSION` constant.
- Changed: Imports report skipped invalid stream records instead of silently ignoring them.
- Added: Rendered workflow coverage for future-version rejection, partial imports, and exported config version.

## [v0.9.0] - 2026-06-28

- Added: Playwright-backed rendered workflow regression test under `npm test`.
- Added: Local test dependency lockfile for repeatable browser regression runs.
- Changed: README now documents local install and test commands.

## [v0.8.0] - 2026-06-28

- Added: Provider adapter registry for YouTube, Twitch, Rumble, and HLS player mounts.
- Added: Per-stream health strip with manual reload controls.
- Added: HLS fatal network/media error recovery through hls.js plus diagnostics health snapshots.
- Changed: Diagnostics now include mounted provider health state per stream.

## [v0.7.0] - 2026-06-28

- Added: Labels and ARIA names for primary setup, room, chat, settings, and modal fields.
- Added: Modal dialog semantics, Escape handling, focus trapping, and focus restoration.
- Changed: Mobile room header now keeps title and sync status controls readable at 390px width.
- Added: Static tests for labelled controls, dialog semantics, focus hooks, and mobile header CSS.

## [v0.6.0] - 2026-06-28

- Added: Relay health badge with connecting, synced, reconnecting, and offline states.
- Added: Automatic relay retry bookkeeping and stale viewer filtering.
- Added: Copyable diagnostics JSON with redacted host keys, relay state, provider counts, browser support, and recent runtime/HLS errors.
- Changed: Viewer counts now expire stale sessions instead of pinning the count to at least one viewer.

## [v0.5.0] - 2026-06-28

- Added: Local vendored Gun and hls.js runtime files instead of unpinned CDN script tags.
- Added: Provider iframe policy metadata with titles, lazy loading, referrer policy, and sandbox strings.
- Added: Tests that assert iframe policy output for YouTube, Twitch, and Rumble embeds.
- Changed: Weather, stream, and Twitch chat iframes now render with hardened attributes.

## [v0.4.0] - 2026-06-27

- Added: Direct HLS `.m3u8` playlist parsing and playback with hls.js.
- Added: HLS parser and embed record tests.
- Changed: Source input copy and exported config examples now cover YouTube, Twitch, Rumble, and HLS.

## [v0.3.0] - 2026-06-27

- Added: Direct Rumble embed URL parsing and player embeds.
- Added: Parser and embed URL tests for Rumble sources.
- Changed: Source input copy and exported config examples now cover YouTube, Twitch, and Rumble.

## [v0.2.0] - 2026-06-27

- Added: Twitch channel and VOD source parsing with player embeds.
- Added: Twitch channel chat sidecar embeds with required parent-domain URL generation.
- Added: Node test coverage for stream source parsing and embed URL generation.
- Changed: Exported room configs now use typed stream source records.
- Changed: Replaced blocking browser alerts/confirmations with toast feedback.
- Fixed: New rooms now display their room name before synced metadata arrives.
- Fixed: Replaced dead Heroku Gun relay defaults with a live public relay.

## [v0.1.0] - 2026-04-25

- Added: Add files via upload
- Added: Add room creation link to README
- Changed: Update README with image and feature description
- Added: Add files via upload
- Changed: Update index.html
- Added: Add files via upload

## Roadmap archive, 2026-08-10 (ROADMAP.md)

<details>
<summary>Original roadmap snapshot</summary>

```markdown
# Roadmap

Static web app for multi-video YouTube/Twitch grid viewing with P2P-synced host/viewer state via Gun.js. Roadmap targets platform reach, more robust sync, and event-tracking-specific features.

## Competitive Research
- **MultiTwitch.tv** offers the simplest reference UX and low friction. Borrow the URL-based room pattern.
- **LiveStreamPool** has better multi-source integration with mixed platforms in one grid.
- **Blackmagic ATEM / vMix** supplies a useful studio-grade Program/Preview metaphor for featured layouts.
- **Watch2Gether** combines a playlist queue with chat and sync, which is closer to the watch-party angle.

## Nice-to-Haves
Current roadmap complete.

## Open-Source Research (Round 2)

### Related OSS Projects
- https://github.com/LordKnish/StreamGrid: cross-platform (Windows, macOS, and Linux) drag-and-drop grid with YouTube, Twitch, RTSP, HLS, MPEG-DASH, and local file support
- https://github.com/pjmagee/multi-stream-viewer: Blazor WebAssembly viewer for Twitch, YouTube, and Kick
- https://github.com/Worsttrumpet/MultiStream-Grid: browser multistream viewer for Twitch, Kick, and YouTube
- https://github.com/ilanzgx/multistream: Electron desktop client with integrated chat per stream
- https://github.com/VenomousRhyme41/Multi-Stream-Viewer: four-stream viewer with theater mode
- https://github.com/smitch88/multi-stream-twitch: React, Redux, and ImmutableJS reference architecture
- https://github.com/kree-nickm/better-multi-twitch: archived snap-to-grid window manager kept for reference

### Features to Borrow
- RTSP/RTSPS, HLS, and MPEG-DASH support from StreamGrid unlocks IP camera feeds and weather radar loops.
- Per-stream integrated chat from ilanzgx/multistream could complement the existing room chat.
- Theater mode from VenomousRhyme41 provides a distraction-free full-bleed grid.
- Vertical-monitor presets from pjmagee/multi-stream-viewer offer a 1×N layout for unusual displays.
- Snap-to-grid window placement from better-multi-twitch could provide a power-user alternative to fixed grids.
- URL-encoded layout state from StreamGrid suggests a path for link-only ephemeral rooms.
- Local file and RTSP ingestion from StreamGrid expands beyond YouTube watch parties.

### Patterns & Architectures Worth Studying
- Compare Gun.js P2P sync with WebRTC mesh and a self-hosted WebSocket service.
- Keep the Blazor WASM approach from pjmagee in mind if Gun.js becomes unreliable at scale.
- Redux or ImmutableJS time-travel debugging from smitch88 could replay host-state changes during moderation disputes.
- Denying `allow-scripts allow-same-origin` together in iframe sandboxes prevents a malicious embed from tracking viewers across streams.
```

</details>
