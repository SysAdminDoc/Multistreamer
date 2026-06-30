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
    assert.match(html, /if \(p\?\.time > cutoff\) count\+\+/);
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
    assert.match(html, /role: isHost \? 'host' : electedHost \? 'elected-host' : 'viewer'/);
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
        'labelsSelect',
        'themeSelect',
        'accentColor',
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
    assert.match(html, /class="stream-health"/);
    assert.match(html, /providerHealth: Array\.from\(mountedProviders\.entries\(\)\)/);
    assert.match(html, /dashJs: Boolean\(window\.dashjs\?\.MediaPlayer\)/);
});

test('keeps import config validation wired', () => {
    assert.match(html, /const CONFIG_VERSION = 8;/);
    assert.match(html, /version: CONFIG_VERSION/);
    assert.match(html, /function validateImportConfig\(data\)/);
    assert.match(html, /function validateLatencyOffsetMs\(value\)/);
    assert.match(html, /function validateGridSettings\(grid\)/);
    assert.match(html, /if \(rawSettings\.grid !== undefined\) next\.grid = validateGridSettings\(rawSettings\.grid\)/);
    assert.match(html, /latencyOffsetMs: validateLatencyOffsetMs\(raw\.latencyOffsetMs\)/);
    assert.match(html, /configVersionFuture: 'Config version \{version\} is newer than supported version \{supported\}/);
    assert.match(html, /throw new Error\(t\('configVersionFuture', \{ version, supported: CONFIG_VERSION \}\)\)/);
    assert.match(html, /function validateWeatherSettings\(weather\)/);
    assert.match(html, /function validateDisplaySettings\(display\)/);
    assert.match(html, /function applyImportedSettings\(importedSettings\)/);
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
