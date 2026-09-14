import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const Gun = require('gun');
const releaseRoot = path.resolve(process.argv[2] || '');
const localChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

assert.ok(releaseRoot, 'Pass the extracted release directory.');
assert.ok(fs.existsSync(path.join(releaseRoot, 'index.html')), 'Release index.html is missing.');

const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname.startsWith('/gun')) return;
    const requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.normalize(path.join(releaseRoot, requestPath));
    if (!filePath.startsWith(releaseRoot)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }
    fs.readFile(filePath, (error, body) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }
        response.writeHead(200, { 'Content-Type': contentType(filePath) });
        response.end(body);
    });
});
Gun({ web: server, file: false, radisk: false, localStorage: false });

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({
    headless: true,
    ...(localChromium && fs.existsSync(localChromium) ? { executablePath: localChromium } : {})
});

try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(relay => {
        window.MULTISTREAMER_RELAYS = [relay];
    }, `${baseUrl}/gun`);
    await context.route('https://www.youtube.com/**', route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Release verification sample</title>'
    }));

    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.title(), 'Multistreamer');
    assert.equal(await page.locator('.setup-logo img').evaluate(image => image.complete && image.naturalWidth === 48), true);
    const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
    assert.equal(manifest.name, 'Multistreamer');

    await page.goto(`${baseUrl}/?room=release-check&host=release-check-key`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#viewerPage.active');
    await page.waitForFunction(() => typeof hasHostControls === 'function' && hasHostControls());
    await page.fill('#videoUrl', 'https://youtu.be/dQw4w9WgXcQ');
    await page.click('.control-bar button:has-text("Add")');
    await page.waitForSelector('.grid-item[data-provider="youtube"]');
    assert.equal(await page.locator('.grid-item[data-provider="youtube"]').count(), 1);
    await context.close();
    console.log('Verified extracted release setup, manifest, host room, and sample stream.');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}

process.exit(0);

function contentType(filePath) {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
    if (filePath.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8';
    if (filePath.endsWith('.svg')) return 'image/svg+xml';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
}
