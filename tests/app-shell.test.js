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
