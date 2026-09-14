const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const heroSource = fs.readFileSync(path.join(root, 'assets', 'concepts', '2026-09-14-marketing', 'production', 'hero-source.svg'), 'utf8');

test('keeps the marketing package complete and release-safe', () => {
    const heroReference = '![Multistreamer marketing hero](assets/marketing/hero.png)';
    assert.equal(readme.split(/\r?\n/, 1)[0], heroReference);
    assert.equal(readme.split(heroReference).length - 1, 1, 'README should reference the hero exactly once');
    assert.match(readme, /https:\/\/ko-fi\.com\/X8K126YVER/);
    assert.doesNotMatch(readme, /[–—]/, 'public README prose must avoid en and em dashes');

    assert.deepEqual(pngSize('assets/marketing/hero.png'), { width: 1600, height: 900, colorType: 2 });
    assert.deepEqual(pngSize('assets/screenshots/control-room.png'), { width: 1600, height: 1000, colorType: 2 });
    assert.deepEqual(pngSize('assets/screenshots/settings.png'), { width: 1600, height: 1000, colorType: 2 });
    assert.deepEqual(pngSize('assets/screenshots/mobile.png'), { width: 390, height: 844, colorType: 2 });
    assert.equal(pngSize('icon.png').colorType, 6, 'app icon should keep a real alpha channel');

    const directions = fs.readdirSync(path.join(root, 'assets', 'concepts', '2026-09-14-marketing', 'directions'))
        .filter(name => /^direction-\d{2}-.*\.png$/.test(name));
    assert.equal(directions.length, 5, 'five reviewed identity directions should stay archived');
    assert.ok(fs.existsSync(path.join(root, 'assets', 'concepts', '2026-09-14-marketing', 'originals', 'icon-v0.38.0.png')));
    assert.ok(fs.existsSync(path.join(root, 'assets', 'brand', 'mark.svg')));
    assert.doesNotMatch(heroSource, /\bv\d+\.\d+(?:\.\d+)?\b/i, 'hero artwork must not include a version number');
    assert.match(heroSource, /REAL APP UI/);
    assert.match(heroSource, /Sample feeds shown/);
});

function pngSize(relativePath) {
    const data = fs.readFileSync(path.join(root, relativePath));
    assert.equal(data.subarray(1, 4).toString('ascii'), 'PNG');
    return {
        width: data.readUInt32BE(16),
        height: data.readUInt32BE(20),
        colorType: data[25]
    };
}
