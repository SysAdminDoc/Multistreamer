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
    assert.match(html, /providerCounts/);
    assert.match(html, /recentErrors: recentErrors\.slice\(-10\)/);
    assert.match(html, /const cutoff = Date\.now\(\) - PRESENCE_TTL_MS/);
    assert.match(html, /if \(p\?\.time > cutoff\) count\+\+/);
    assert.match(html, /function redactSensitiveUrl\(value\)/);
    assert.match(html, /url\.searchParams\.set\('host', '\[redacted\]'\)/);
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
        'labelsSelect',
        'themeSelect',
        'accentColor',
        'weatherLat',
        'weatherLon',
        'shareViewerLink',
        'shareHostLink',
        'announcementInput',
        'importData',
        'labelInput'
    ].forEach(id => {
        const hasLabel = new RegExp(`<label[^>]+for="${id}"`).test(html);
        const hasAria = new RegExp(`id="${id}"[^>]+aria-(label|labelledby)=`).test(html);
        assert.ok(hasLabel || hasAria, `${id} should have a label or ARIA name`);
    });
});

test('keeps dialogs semantic and keyboard-managed', () => {
    ['shareModal', 'announcementModal', 'importModal', 'labelModal'].forEach(id => {
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

test('keeps provider adapters and health recovery wired', () => {
    assert.match(html, /const providerAdapters = \{/);
    assert.match(html, /youtube: createIframeAdapter\('youtube'\)/);
    assert.match(html, /twitch: createIframeAdapter\('twitch'\)/);
    assert.match(html, /hls: createHlsAdapter\(\)/);
    assert.match(html, /function mountProviderAdapters\(\)/);
    assert.match(html, /function destroyProviderAdapters\(\)/);
    assert.match(html, /function handleHlsError\(instance, event, data = \{\}\)/);
    assert.match(html, /function reloadStream\(id\)/);
    assert.match(html, /class="stream-health"/);
    assert.match(html, /providerHealth: Array\.from\(mountedProviders\.entries\(\)\)/);
});

test('keeps import config validation wired', () => {
    assert.match(html, /const CONFIG_VERSION = 4;/);
    assert.match(html, /version: CONFIG_VERSION/);
    assert.match(html, /function validateImportConfig\(data\)/);
    assert.match(html, /Config version \$\{version\} is newer than supported version \$\{CONFIG_VERSION\}/);
    assert.match(html, /function validateWeatherSettings\(weather\)/);
    assert.match(html, /function validateDisplaySettings\(display\)/);
    assert.match(html, /function applyImportedSettings\(importedSettings\)/);
    assert.match(html, /Skipped \$\{result\.skippedStreams\} invalid stream/);
});
