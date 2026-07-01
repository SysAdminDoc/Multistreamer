const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('keeps app version strings in sync', () => {
    const escapedVersion = pkg.version.replaceAll('.', '\\.');
    assert.match(html, new RegExp(`const APP_VERSION = '${escapedVersion}'`));
    assert.match(readme, new RegExp(`version-v${escapedVersion}-blue`));
});

test('exposes sync health and redacted diagnostics fields', () => {
    assert.match(html, /id="syncStatus"/);
    assert.match(html, /function buildDiagnostics\(\)/);
    assert.match(html, /url: redactSensitiveUrl\(location\.href\)/);
    assert.match(html, /retryCount: relayHealth\.retryCount/);
    assert.match(html, /leaderElection: \{/);
    assert.match(html, /playbackSync: buildPlaybackSyncDiagnostics\(\)/);
    assert.match(html, /providerCounts/);
    assert.match(html, /recentErrors: recentErrors\.slice\(-10\)/);
    assert.match(html, /const cutoff = Date\.now\(\) - PRESENCE_TTL_MS/);
    assert.match(html, /if \(p\?\.time > cutoff && p\.online !== false && p\.role !== 'blocked'\) count\+\+/);
    assert.match(html, /function redactSensitiveUrl\(value\)/);
    assert.match(html, /url\.searchParams\.set\('host', '\[redacted\]'\)/);
});

test('keeps leader election wired', () => {
    assert.match(html, /const LEADER_ELECTION_CHECK_MS = 15000;/);
    assert.match(html, /const LEADER_TTL_MS = 45000;/);
    assert.match(html, /let electedHost = false;/);
    assert.match(html, /roomRef\.get\('sync'\)\.get\('leader'\)\.on\(handleLeaderState\)/);
    assert.match(html, /function checkLeaderElection\(\)/);
    assert.match(html, /function resolveLeaderElection\(activeSessions\)/);
    assert.match(html, /function publishLeaderState\(role, quorumSize, claimedAt = Date\.now\(\)\)/);
    assert.match(html, /function hasHostControls\(\)/);
    assert.match(html, /role: blocked \? 'blocked' : isHost \? 'host' : electedHost \? 'elected-host' : 'viewer'/);
    assert.match(html, /mode: isHost \? 'host' : electedHost \? 'elected-host' : 'viewer'/);
    assert.match(html, /document\.body\.classList\.toggle\('viewer-mode', !controls\)/);
});

test('keeps native playback sync calibration wired', () => {
    assert.match(html, /const SYNC_HEARTBEAT_MS = 5000;/);
    assert.match(html, /const SYNC_TARGET_LIVE_DELAY_MS = 8000;/);
    assert.match(html, /roomRef\.get\('sync'\)\.get\('clock'\)\.on\(handleHostClockSync\)/);
    assert.match(html, /function startHostPlaybackSync\(\)/);
    assert.match(html, /function writePlaybackSyncPulse\(\)/);
    assert.match(html, /function handleHostClockSync\(data\)/);
    assert.match(html, /function applyPlaybackSyncTarget\(target, defaultTargetDelayMs, pulseSentAt\)/);
    assert.match(html, /baseTargetDelayMs \+ getLatencyOffsetMs\(target\.id\)/);
    assert.match(html, /function getLatencyOffsetMs\(streamId\)/);
    assert.match(html, /roomRef\.get\('sync'\)\.get\('scrub'\)\.on\(handleHostScrubSync\)/);
    assert.match(html, /function publishScrubSync\(instance\)/);
    assert.match(html, /function handleHostScrubSync\(data\)/);
    assert.match(html, /function applyScrubSyncTarget\(target, options = \{\}\)/);
    assert.match(html, /video\.addEventListener\('seeked', instance\.onSeeked\)/);
    assert.match(html, /function canSeekToTime\(video, time\)/);
    assert.match(html, /function isNativeSyncProvider\(instance\)/);
    assert.match(html, /instance\.type === 'hls' \|\| instance\.type === 'dash'/);
    assert.match(html, /function estimateNativeLiveLatencyMs\(instance\)/);
    assert.match(html, /getCurrentLiveLatency/);
    assert.match(html, /function buildPlaybackSyncDiagnostics\(\)/);
    assert.match(html, /scrubEvents: playbackSync\.scrubEvents\.slice\(-10\)/);
    assert.match(html, /iframeProviders: 'diagnostics-only'/);
});

test('keeps primary form controls labelled', () => {
    [
        'newRoomName',
        'newRoomTitle',
        'newHostKey',
        'generatedHostLink',
        'generatedViewerLink',
        'joinRoomName',
        'joinHostKey',
        'roomTitleInput',
        'videoUrl',
        'usernameInput',
        'messageInput',
        'gridGapSlider',
        'gridPresetSelect',
        'customGridTemplate',
        'slowModeSeconds',
        'rateLimitCount',
        'rateLimitSeconds',
        'youtubeApiKey',
        'labelsSelect',
        'themeSelect',
        'accentColor',
        'weatherProvider',
        'weatherLat',
        'weatherLon',
        'shareViewerLink',
        'shareHostLink',
        'announcementInput',
        'importData',
        'labelInput',
        'latencyOffsetInput'
    ].forEach(id => {
        const hasLabel = new RegExp(`<label[^>]+for="${id}"`).test(html);
        const hasAria = new RegExp(`id="${id}"[^>]+aria-(label|labelledby)=`).test(html);
        assert.ok(hasLabel || hasAria, `${id} should have a label or ARIA name`);
    });
});

test('keeps dialogs semantic and keyboard-managed', () => {
    ['shareModal', 'announcementModal', 'importModal', 'labelModal', 'latencyOffsetModal'].forEach(id => {
        const pattern = new RegExp(`id="${id}"[^>]+role="dialog"[^>]+aria-modal="true"[^>]+aria-labelledby=`);
        assert.match(html, pattern);
    });
    assert.match(html, /function openModal\(id, focusSelector = ''\)/);
    assert.match(html, /function handleModalKeydown\(event\)/);
    assert.match(html, /event\.key === 'Escape'/);
    assert.match(html, /event\.key !== 'Tab'/);
});

test('keeps mobile header compact and chat toggle stateful', () => {
    assert.match(html, /\.top-bar \{\s+display: grid;/);
    assert.match(html, /grid-template-columns: minmax\(0, 1fr\);/);
    assert.match(html, /id="chatToggleBtn"[^>]+aria-expanded="true"/);
    assert.match(html, /chatToggleBtn'\)\.setAttribute\('aria-expanded', String\(chatExpanded\)\)/);
});

test('keeps chat moderation tokens wired', () => {
    assert.match(html, /const MODERATION_KICK_MS = 10 \* 60 \* 1000;/);
    assert.match(html, /const MODERATION_ACTIONS = new Set\(\['kick', 'ban'\]\)/);
    assert.match(html, /let moderationRef = null;/);
    assert.match(html, /localStorage\.getItem\('ms-mod-token'\)/);
    assert.match(html, /moderationRef = roomRef\.get\('moderation'\)/);
    assert.match(html, /moderationRef\.get\(moderationToken\)\.on\(handleModerationRecord\)/);
    assert.match(html, /function handleModerationRecord\(record\)/);
    assert.match(html, /function applyModerationBlock\(record\)/);
    assert.match(html, /function moderateUser\(target, action, label = ''\)/);
    assert.match(html, /moderationRef\.get\(cleanTarget\)\.put\(record\)/);
    assert.match(html, /moderationToken/);
    assert.match(html, /class="moderation-notice"/);
    assert.match(html, /class="mod-actions"/);
    assert.match(html, /body\.moderated-mode/);
    assert.match(html, /role: blocked \? 'blocked'/);
    assert.match(html, /presence\.online === false \|\| presence\.role === 'blocked'/);
    assert.match(html, /moderationControlsForMessage\(msg\)/);
    assert.match(html, /moderationBlocked: 'Chat is disabled because this browser was removed by the host\.'/);
});

test('keeps ephemeral reactions wired', () => {
    assert.match(html, /const REACTION_EVENT_TTL_MS = 15000;/);
    assert.match(html, /const REACTION_TYPES = \{/);
    assert.match(html, /cheer: \{ labelKey: 'reactionCheer', glyph: '&#128079;' \}/);
    assert.match(html, /id="reactionStrip"/);
    assert.match(html, /id="reactionLayer"/);
    assert.match(html, /function sendReaction\(kind\)/);
    assert.match(html, /chatRef\.get\('reactions'\)\.get\(id\)\.put\(reaction\)/);
    assert.match(html, /chatRef\.get\('reactions'\)\.map\(\)\.on/);
    assert.match(html, /function renderReaction\(reaction\)/);
    assert.match(html, /className = 'reaction-burst'/);
    assert.match(html, /burst\.dataset\.reaction = reaction\.kind/);
    assert.match(html, /reactionBlocked: 'Reactions are disabled because this browser was removed by the host\.'/);
});

test('keeps chat history export wired without moderation tokens', () => {
    assert.match(html, /id="chatActions"/);
    assert.match(html, /onclick="exportChatHistory\('json'\)"/);
    assert.match(html, /onclick="exportChatHistory\('txt'\)"/);
    assert.match(html, /function exportChatHistory\(format\)/);
    assert.match(html, /function getChatHistory\(\)/);
    assert.match(html, /function formatChatHistoryText\(messages\)/);
    assert.match(html, /function downloadBlob\(filename, type, content\)/);
    assert.match(html, /const filename = `\$\{roomId \|\| 'room'\}-chat-\$\{stamp\}\.\$\{normalizedFormat\}`/);
    assert.match(html, /username: msg\.system \? '' : String\(msg\.username \|\| ''\)/);
    assert.doesNotMatch(html, /sessionId: String\(msg\.sessionId/);
    assert.doesNotMatch(html, /moderationToken: String\(msg\.moderationToken/);
    assert.match(html, /chatExported: 'Chat history exported as \{format\}\.'/);
});

test('keeps synced chat rate controls wired', () => {
    assert.match(html, /settings\.chat/);
    assert.match(html, /id="slowModeSeconds"/);
    assert.match(html, /id="rateLimitCount"/);
    assert.match(html, /id="rateLimitSeconds"/);
    assert.match(html, /function applyChatSettings\(next\)/);
    assert.match(html, /function normalizeChatSetting\(key, value, fallback\)/);
    assert.match(html, /function setChatSetting\(key, value\)/);
    assert.match(html, /roomRef\.get\('settings'\)\.get\('chat'\)\.get\('slowModeSeconds'\)\.on/);
    assert.match(html, /function checkChatSendAllowed\(now = Date\.now\(\)\)/);
    assert.match(html, /function recordChatSend\(now = Date\.now\(\)\)/);
    assert.match(html, /chatSlowModeWait: 'Slow mode: wait \{seconds\}s before sending again\.'/);
    assert.match(html, /chatRateLimited: 'Rate limit reached: \{count\} messages per \{seconds\}s\.'/);
});

test('keeps YouTube LiveChat mirror wired locally', () => {
    assert.match(html, /const YOUTUBE_API_BASE = 'https:\/\/www\.googleapis\.com\/youtube\/v3'/);
    assert.match(html, /localStorage\.getItem\('ms-youtube-api-key'\)/);
    assert.match(html, /id="youtubeChatMirrorBtn"/);
    assert.match(html, /function saveYouTubeApiKey\(\)/);
    assert.match(html, /function toggleYouTubeChatMirror\(\)/);
    assert.match(html, /async function startYouTubeChatMirror\(\)/);
    assert.match(html, /function stopYouTubeChatMirror/);
    assert.match(html, /function findYouTubeMirrorStream\(\)/);
    assert.match(html, /async function fetchYouTubeLiveChatId\(stream\)/);
    assert.match(html, /async function pollYouTubeLiveChat\(\)/);
    assert.match(html, /function mirrorYouTubeChatMessage\(item\)/);
    assert.match(html, /videos\?part=liveStreamingDetails/);
    assert.match(html, /liveChat\/messages/);
    assert.match(html, /source: 'youtube'/);
    assert.match(html, /class="source-tag"/);
    assert.match(html, /youtubeMirrorNeedsKey: 'Save a YouTube Data API key first\.'/);
});

test('keeps manual grid layouts wired', () => {
    assert.match(html, /const GRID_PRESETS = new Set\(\['auto', '1\+2', '2\+3', '3\+1', 'custom'\]\)/);
    assert.match(html, /id="gridPresetSelect"/);
    assert.match(html, /id="customGridTemplate"/);
    assert.match(html, /function setGridSetting\(key, value\)/);
    assert.match(html, /function applyGridSettings\(next\)/);
    assert.match(html, /function getGridPlan\(count\)/);
    assert.match(html, /preset === '1\+2'/);
    assert.match(html, /preset === '2\+3'/);
    assert.match(html, /preset === '3\+1'/);
    assert.match(html, /CSS\.supports\('grid-template-columns', text\)/);
    assert.match(html, /roomRef\.get\('settings'\)\.get\('grid'\)\.get\('preset'\)\.on/);
});

test('keeps provider adapters and health recovery wired', () => {
    assert.match(html, /<script src="vendor\/dash\.all-5\.2\.0\.min\.js"><\/script>/);
    assert.match(html, /const providerAdapters = \{/);
    assert.match(html, /youtube: createIframeAdapter\('youtube'\)/);
    assert.match(html, /twitch: createIframeAdapter\('twitch'\)/);
    assert.match(html, /iframe: createIframeAdapter\('iframe'\)/);
    assert.match(html, /hls: createHlsAdapter\(\)/);
    assert.match(html, /dash: createDashAdapter\(\)/);
    assert.match(html, /function mountProviderAdapters\(\)/);
    assert.match(html, /function destroyProviderAdapters\(\)/);
    assert.match(html, /function handleHlsError\(instance, event, data = \{\}\)/);
    assert.match(html, /function createDashAdapter\(\)/);
    assert.match(html, /function configureDashLowLatency\(player\)/);
    assert.match(html, /function reloadStream\(id\)/);
    assert.match(html, /id="popoutPanel"/);
    assert.match(html, /function openPopout\(id\)/);
    assert.match(html, /function closePopout\(\)/);
    assert.match(html, /function buildPopoutMedia\(stream, embed\)/);
    assert.match(html, /popoutProvider\.adapter\.destroy\(popoutProvider\.instance\)/);
    assert.match(html, /function setStreamVolume\(id, value\)/);
    assert.match(html, /function applyVideoVolume\(instance, value\)/);
    assert.match(html, /class="volume-slider"/);
    assert.match(html, /volume\(instance, volume\)/);
    assert.match(html, /class="stream-health"/);
    assert.match(html, /providerHealth: Array\.from\(mountedProviders\.entries\(\)\)/);
    assert.match(html, /dashJs: Boolean\(window\.dashjs\?\.MediaPlayer\)/);
});

test('keeps import config validation wired', () => {
    assert.match(html, /const CONFIG_VERSION = 11;/);
    assert.match(html, /version: CONFIG_VERSION/);
    assert.match(html, /function validateImportConfig\(data\)/);
    assert.match(html, /function validateLatencyOffsetMs\(value\)/);
    assert.match(html, /function validateImportVolume\(value, muted\)/);
    assert.match(html, /function validateGridSettings\(grid\)/);
    assert.match(html, /function validateChatSettings\(chat\)/);
    assert.match(html, /if \(rawSettings\.grid !== undefined\) next\.grid = validateGridSettings\(rawSettings\.grid\)/);
    assert.match(html, /if \(rawSettings\.chat !== undefined\) next\.chat = validateChatSettings\(rawSettings\.chat\)/);
    assert.match(html, /volume: validateImportVolume\(raw\.volume, raw\.muted\)/);
    assert.match(html, /latencyOffsetMs: validateLatencyOffsetMs\(raw\.latencyOffsetMs\)/);
    assert.match(html, /configVersionFuture: 'Config version \{version\} is newer than supported version \{supported\}/);
    assert.match(html, /throw new Error\(t\('configVersionFuture', \{ version, supported: CONFIG_VERSION \}\)\)/);
    assert.match(html, /function validateWeatherSettings\(weather\)/);
    assert.match(html, /const WEATHER_PROVIDERS = \{/);
    assert.match(html, /function buildWeatherOverlayUrl\(weather\)/);
    assert.match(html, /settingsWeatherProvider: 'settings\.weather\.provider must be windy, zoomEarth, ventusky, or lightningmaps\.'/);
    assert.match(html, /function validateDisplaySettings\(display\)/);
    assert.match(html, /function applyImportedSettings\(importedSettings\)/);
    assert.match(html, /settingsChatSlowMode: 'settings\.chat\.slowModeSeconds must be an integer from 0 to 60\.'/);
    assert.match(html, /configImportedSkipped: 'Config imported\. Skipped \{count\} invalid \{streamWord\}\.'/);
    assert.match(html, /t\('configImportedSkipped', \{ count: result\.skippedStreams/);
});

test('keeps UI copy and chat time formatting localization-ready', () => {
    assert.match(html, /const locale = document\.documentElement\.lang \|\| navigator\.language \|\| 'en';/);
    assert.match(html, /const messages = \{/);
    assert.match(html, /function t\(key, vars = \{\}\)/);
    assert.match(html, /function applyLocalizedCopy\(root = document\)/);
    assert.match(html, /function formatChatTime\(timestamp\)/);
    assert.match(html, /new Intl\.DateTimeFormat\(locale, \{ hour: '2-digit', minute: '2-digit' \}\)/);
    assert.doesNotMatch(html, /toLocaleTimeString/);

    [
        'setupSubtitle',
        'validStreamPrompt',
        'configVersionFuture',
        'configImportedSkipped',
        'userJoined'
    ].forEach(key => assert.match(html, new RegExp(`\\b${key}:`), `${key} should be defined in messages`));

    const translationKeys = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => match[1]);
    assert.ok(translationKeys.length > 40, 'static copy should be wired through data-i18n attributes');
    translationKeys.forEach(key => {
        assert.match(html, new RegExp(`\\b${key}:`), `${key} should be defined in messages`);
    });
});
