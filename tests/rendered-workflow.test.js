const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const localChromium = 'C:/Users/--/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';

let server;
let baseUrl;
let browser;

test.before(async () => {
    ({ server, baseUrl } = await startStaticServer());
    browser = await chromium.launch({
        headless: true,
        ...(fs.existsSync(localChromium) ? { executablePath: localChromium } : {})
    });
});

test.after(async () => {
    await browser?.close();
    await new Promise(resolve => server?.close(resolve));
});

test('rendered host, viewer, import, dialog, and mobile workflows', { timeout: 60000 }, async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
    await context.route('https://www.youtube.com/**', route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>YouTube stub</title>'
    }));

    const room = 'rendered-' + Date.now();
    const hostKey = 'host-' + Date.now();
    const host = await context.newPage();
    await host.goto(`${baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await host.waitForSelector('#viewerPage.active');
    await host.waitForFunction(() => document.body.classList.contains('viewer-mode') === false);

    await host.fill('#videoUrl', 'https://youtu.be/dQw4w9WgXcQ');
    await host.click('.control-bar button:has-text("Add")');
    await host.waitForSelector('.grid-item[data-provider="youtube"]');
    assert.equal(await host.locator('.grid-item[data-provider="youtube"]').count(), 1);

    await host.click('.grid-item[data-provider="youtube"] button:has-text("Remove")');
    await host.waitForSelector('.empty-state');

    await host.click('button:has-text("Settings")');
    await host.click('.settings-actions button:has-text("Import")');
    await host.waitForSelector('#importModal.show');
    assert.equal(await host.getAttribute('#importModal', 'role'), 'dialog');
    assert.equal(await host.getAttribute('#importModal', 'aria-modal'), 'true');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'importData');

    await host.fill('#importData', '{bad json');
    await host.click('#importModal .btn-primary');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Invalid config')));

    await host.fill('#importData', JSON.stringify({ version: 99, streams: [] }));
    await host.click('#importModal .btn-primary');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('newer than supported')));

    await host.fill('#importData', JSON.stringify({
        version: 4,
        room,
        streams: [
            { id: 'dQw4w9WgXcQ', type: 'youtube', sourceId: 'dQw4w9WgXcQ', sourceKind: 'video', muted: true, label: 'Workflow QA' },
            { id: 'bad-hls', type: 'hls', sourceId: 'not-a-url', sourceKind: 'playlist' }
        ],
        settings: {
            layout: 'grid',
            featuredId: 'dQw4w9WgXcQ',
            weather: { enabled: true, lat: 41.25, lon: -72.5 },
            display: { gridGap: 4, labels: 'always', theme: 'amoled', accent: '#00d4ff' }
        }
    }));
    await host.click('#importModal .btn-primary');
    await host.waitForSelector('.grid-item[data-provider="youtube"]');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Skipped 1 invalid stream')));
    assert.equal(await host.locator('.grid-item[data-stream-id="bad-hls"]').count(), 0);

    const [download] = await Promise.all([
        host.waitForEvent('download'),
        host.click('.settings-actions .btn-primary')
    ]);
    assert.equal(download.suggestedFilename(), `${room}.json`);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.version, 4);

    await host.click('button:has-text("Share")');
    await host.waitForSelector('#shareModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'shareViewerLink');
    await host.keyboard.press('Tab');
    assert.equal(await host.evaluate(() => document.getElementById('shareModal').contains(document.activeElement)), true);
    await host.keyboard.press('Escape');
    await host.waitForFunction(() => document.getElementById('shareModal').getAttribute('aria-hidden') === 'true');
    assert.equal(await host.evaluate(() => document.activeElement.textContent.trim()), 'Share');

    const viewer = await context.newPage();
    await viewer.goto(`${baseUrl}/?room=${room}`, { waitUntil: 'domcontentloaded' });
    await viewer.waitForSelector('#viewerPage.active');
    await viewer.waitForFunction(() => document.body.classList.contains('viewer-mode'));
    assert.equal(await viewer.locator('.control-bar').isVisible(), false);

    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#viewerPage.active');
    const mobileLayout = await mobilePage.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        titleWidth: document.getElementById('roomTitle').getBoundingClientRect().width,
        statusRight: document.querySelector('.top-status').getBoundingClientRect().right,
        viewportWidth: window.innerWidth
    }));
    assert.equal(mobileLayout.overflow, 0);
    assert.ok(mobileLayout.titleWidth > 120);
    assert.ok(mobileLayout.statusRight <= mobileLayout.viewportWidth);
    await mobile.close();
});

function startStaticServer() {
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1');
        const requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
        const filePath = path.normalize(path.join(root, requestPath));
        if (!filePath.startsWith(root)) {
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

    return new Promise(resolve => {
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
        });
    });
}

function contentType(filePath) {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
}
