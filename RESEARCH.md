# Research - MultiStream

## Executive Summary
MultiStream is a static, self-hosted multi-video room viewer for YouTube, Twitch, Rumble, HLS, weather embeds, synced settings, and room chat. Its strongest shape is low-friction GitHub Pages deployment with Gun-backed shared state, but the next highest-value direction is trust and field reliability: harden third-party embeds/CDN loading, replace URL-visible host secrets, add stream health recovery, fix accessibility, and make repeat-use/mobile sessions resilient before expanding into more protocols.

Top opportunities: harden iframe/CDN boundaries; replace plaintext host links with hashed or signed room capabilities; add relay/sync health and reconnect recovery; add accessible labels/dialog semantics/focus management; add player adapters for YouTube/Twitch/HLS health and control; add rendered regression tests; validate import/export schema versions; add installable/offline shell; add diagnostics export; add i18n-ready string/date handling.

## Product Map
- Core workflows: create or join a room; host adds streams/weather and layout settings; viewers watch synced room state; participants use room chat; hosts import/export JSON configs.
- User personas: storm watchers/event monitors needing many live views, watch-party hosts, Twitch/YouTube viewers, security/camera viewers using HLS, self-hosters who prefer static hosting.
- Platforms and distribution: browser-only static app, GitHub Pages target, local `python -m http.server 4173`, CDN Gun and hls.js, no build pipeline.
- Key integrations and data flows: URL params provide room/host mode; Gun relay stores room metadata, streams, settings, presence, and chat; iframe/video embeds load YouTube, Twitch, Rumble, Windy, and HLS media; localStorage stores username, session ID, and recent room host links.

## Competitive Landscape
- StreamGrid: broad protocol/source coverage including HLS, MPEG-DASH, RTSP, and local files. Learn source health/retry and protocol breadth; avoid desktop-only assumptions that weaken static hosting.
- MultiTwitch and multistre.am-style viewers: very low-friction URL composition and instant grid creation. Learn link-first sharing; avoid relying only on URL state when persistence, host control, and privacy matter.
- Watch2Gether: mature room, playlist, chat, and synchronized viewing expectations. Learn onboarding, moderation, and queue affordances; avoid turning MultiStream into a full social network.
- VDO.Ninja: strong WebRTC/source-control model for live production and OBS workflows. Learn diagnostics, device/source status, and OBS-friendly output; avoid adding camera/mic capture without explicit privacy UX.
- OBS Browser Source: validates demand for composited browser scenes. Learn transparent/fullscreen/embed-safe output modes; avoid requiring OBS for normal viewing.
- pjmagee/multi-stream-viewer and MultiStream-Grid: mixed Twitch/YouTube/Kick grids and vertical-display layouts. Learn preset layouts and per-source chat; avoid Kick embed work until public framing is usable.
- hls.js/dash.js ecosystem: standard player events, error recovery, latency controls, and ABR. Learn adapter-based player lifecycle management; avoid hand-rolled media buffering.
- Gun/SEA: supports cryptographic identities and encrypted/authenticated data paths. Learn signed room authority and migration path; avoid storing effective host passwords in URL/localStorage.

## Security, Privacy, and Reliability
- Verified: `index.html:1151`, `index.html:1170`, `index.html:1204`, `index.html:1222`, `index.html:1245`, and `index.html:1554` expose host access in query strings, recent-room localStorage, and share links. Existing ROADMAP already has "Room passwords (hash) so viewer URL doesn't leak host access"; treat it as a P0 trust item.
- Verified: `index.html:11` and `index.html:13` load remote scripts without integrity or a local vendored fallback. MDN SRI guidance supports pinning third-party CDN assets.
- Verified: `index.html:1481` through `index.html:1484` emit YouTube/Twitch/Rumble iframes without `title`, `sandbox`, `loading`, or `referrerpolicy`; rendered check confirmed those attributes are absent on the YouTube iframe.
- Verified: `index.html:1494` through `index.html:1512` attach HLS but do not handle hls.js error events, retry, stalled playback, or user-visible per-stream failure state.
- Verified: `npm audit --omit=dev --json` cannot run because the repo has no lockfile; dependency risk is currently CDN/runtime risk, not npm tree risk.
- Missing guardrails: import validation is shape-light (`index.html:1571`), chat has no size/rate limits (`index.html:1623`), presence has no explicit disconnect cleanup (`index.html:1320`), and public Gun relay failure has no UI state.
- Recovery needs: per-stream reload/retry, relay status and fallback configuration, exportable diagnostics, schema migration for config versions, and graceful offline/read-only room mode.

## Architecture Assessment
- `index.html` is 1,661 lines and owns layout, persistence, sync, chat, settings, import/export, and media rendering. Split into app-state, sync adapter, player adapters, chat, settings, and renderer modules before adding more source types.
- `stream-sources.js` is the right boundary for parsing/building embeds; extend it with typed embed policy metadata so iframe security attributes and player behavior are not scattered in template strings.
- `tests/source-parsing.test.js` covers source parsing and embed URL generation, but there are no rendered tests for host/viewer mode, import/export, accessibility, mobile layout, or HLS failure paths.
- Accessibility gaps are verified in the rendered DOM: 20 inputs without labels or `aria-label`, modal containers without `role="dialog"`/`aria-modal`, and mobile room-title clipping at 390px width.
- Documentation gaps: README explains self-hosting but not security tradeoffs of public Gun relays, host links, CDN scripts, or unsupported embed/provider failure behavior.
- Distribution gaps: no `manifest.json`, service worker, offline shell, pinned asset bundle, release artifact, or lockfile-backed dependency audit.

## Rejected Ideas
- Kick iframe support: rejected for now because `Roadmap_Blocked.md` documents provider framing as blocked by HTTP 403 / `X-Frame-Options: sameorigin`.
- Direct browser RTSP playback: rejected for static-only implementation because `Roadmap_Blocked.md` correctly notes browsers need an RTSP-to-HLS/WebRTC proxy/transmuxer.
- New keyboard shortcut work: rejected because the global project rules prohibit keyboard shortcuts, even though an older ROADMAP line lists them.
- Plugin marketplace: rejected for now because this project is a static single-app viewer; source adapters and allowlisted embed presets give most of the value with less governance and security risk.
- Full production switcher/studio mode: rejected because OBS, StreamYard, Restream, vMix, and ATEM already cover production switching; MultiStream should remain a viewer/watch-room unless OBS output support is specifically needed.
- User accounts/social profiles: rejected because they conflict with the no-backend, low-friction room model; signed room capabilities and local display names are enough.

## Sources
OSS competitors and adjacent projects:
- https://github.com/LordKnish/StreamGrid
- https://github.com/pjmagee/multi-stream-viewer
- https://github.com/Worsttrumpet/MultiStream-Grid
- https://github.com/ilanzgx/multistream
- https://github.com/smitch88/multi-stream-twitch
- https://github.com/video-dev/hls.js
- https://github.com/Dash-Industry-Forum/dash.js
- https://github.com/bluenviron/mediamtx
- https://github.com/ossrs/srs
- https://github.com/krzemienski/awesome-video

Commercial/community/adjacent products:
- https://www.multitwitch.tv/
- https://w2g.tv/
- https://vdo.ninja/
- https://www.streamyard.com/
- https://restream.io/studio
- https://obsproject.com/kb/browser-source

Standards, platform APIs, and security:
- https://dev.twitch.tv/docs/embed/everything/
- https://developers.google.com/youtube/iframe_api_reference
- https://gun.eco/docs/SEA
- https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://www.w3.org/WAI/tutorials/forms/labels/
- https://web.dev/learn/pwa/service-workers
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API
- https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html

## Open Questions
- Which relay deployment should be the recommended default after the public Gun relay: owner-hosted Gun, a simple WebSocket sync service, or a managed backend option?
- Should host authority be backward-compatible with existing `?host=` rooms, or is a one-time room migration acceptable for safer links?
