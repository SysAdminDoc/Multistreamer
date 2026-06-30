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

test('rendered host, viewer, import, dialog, and mobile workflows', { timeout: 120000 }, async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
    await context.route('https://www.youtube.com/**', route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>YouTube stub</title>'
    }));
    await context.route('https://example.com/**', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('.mpd')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/dash+xml',
                body: '<?xml version="1.0" encoding="UTF-8"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT0S" minBufferTime="PT1S"><Period duration="PT0S"/></MPD>'
            });
        }
        return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    });
    await context.route('https://embed.windy.com/**', route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Windy stub</title>'
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
    await host.click('.grid-item[data-provider="youtube"] button:has-text("Pop Out")');
    await host.waitForSelector('#popoutPanel.show iframe.video-frame');
    assert.equal(await host.getAttribute('#popoutPanel', 'aria-hidden'), 'false');
    await host.click('#popoutPanel button[aria-label="Close pop-out"]');
    await host.waitForFunction(() => document.getElementById('popoutPanel').getAttribute('aria-hidden') === 'true');

    await host.click('.grid-item[data-provider="youtube"] button:has-text("Remove")');
    await host.waitForSelector('.empty-state');

    await host.fill('#videoUrl', 'https://example.com/live/manifest.mpd');
    await host.click('.control-bar button:has-text("Add")');
    await host.waitForSelector('.grid-item[data-provider="dash"] .dash-video');
    assert.equal(await host.locator('.grid-item[data-provider="dash"]').count(), 1);
    await host.click('.grid-item[data-provider="dash"] button:has-text("Remove")');
    await host.waitForSelector('.empty-state');

    await host.fill('#videoUrl', 'iframe:https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5');
    await host.click('.control-bar button:has-text("Add")');
    await host.waitForSelector('.grid-item[data-provider="iframe"] iframe.video-frame');
    assert.equal(await host.locator('.grid-item[data-provider="iframe"]').count(), 1);
    await host.click('.grid-item[data-provider="iframe"] button:has-text("Remove")');
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
        version: 9,
        room,
        streams: [
            { id: 'dQw4w9WgXcQ', type: 'youtube', sourceId: 'dQw4w9WgXcQ', sourceKind: 'video', muted: true, volume: 0, label: 'Workflow QA', latencyOffsetMs: 0 },
            { id: 'bad-hls', type: 'hls', sourceId: 'not-a-url', sourceKind: 'playlist' }
        ],
        settings: {
            layout: 'grid',
            featuredId: 'dQw4w9WgXcQ',
            grid: { preset: 'custom', customTemplate: 'minmax(0, 2fr) minmax(220px, 1fr)' },
            weather: { enabled: true, lat: 41.25, lon: -72.5 },
            display: { gridGap: 4, labels: 'always', theme: 'amoled', accent: '#00d4ff' }
        }
    }));
    await host.click('#importModal .btn-primary');
    await host.waitForSelector('.grid-item[data-provider="youtube"]');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Skipped 1 invalid stream')));
    assert.equal(await host.locator('.grid-item[data-stream-id="bad-hls"]').count(), 0);

    await host.click('.grid-item[data-provider="youtube"] button:has-text("Offset")');
    await host.waitForSelector('#latencyOffsetModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'latencyOffsetInput');
    await host.fill('#latencyOffsetInput', '2.5');
    await host.click('#latencyOffsetModal .btn-primary');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Latency offset saved')));
    await host.waitForFunction(() => document.querySelector('.latency-offset-badge')?.textContent === '+2.5s');
    await host.locator('.grid-item[data-provider="youtube"] .volume-slider').fill('60');
    await host.waitForFunction(() => document.querySelector('.grid-item[data-provider="youtube"] .volume-slider')?.value === '60');

    const [download] = await Promise.all([
        host.waitForEvent('download'),
        host.click('.settings-actions .btn-primary', { noWaitAfter: true })
    ]);
    assert.equal(download.suggestedFilename(), `${room}.json`);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.version, 9);
    assert.deepEqual(exported.settings.grid, { preset: 'custom', customTemplate: 'minmax(0, 2fr) minmax(220px, 1fr)' });
    const exportedWorkflowStream = exported.streams.find(stream => stream.id === 'dQw4w9WgXcQ');
    assert.equal(exportedWorkflowStream.latencyOffsetMs, 2500);
    assert.equal(exportedWorkflowStream.volume, 60);

    await host.click('button:has-text("Share")');
    await host.waitForSelector('#shareModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'shareViewerLink');
    await host.keyboard.press('Tab');
    assert.equal(await host.evaluate(() => document.getElementById('shareModal').contains(document.activeElement)), true);
    await host.keyboard.press('Escape');
    await host.waitForFunction(() => document.getElementById('shareModal').getAttribute('aria-hidden') === 'true');
    assert.equal(await host.evaluate(() => document.activeElement.textContent.trim()), 'Share');
    await host.click('#settingsPanel .settings-header button');
    await host.waitForFunction(() => !document.getElementById('settingsPanel').classList.contains('open'));

    const viewer = await context.newPage();
    await viewer.goto(`${baseUrl}/?room=${room}`, { waitUntil: 'domcontentloaded' });
    await viewer.waitForSelector('#viewerPage.active');
    await viewer.waitForFunction(() => document.body.classList.contains('viewer-mode'));
    assert.equal(await viewer.locator('.control-bar').isVisible(), false);
    await viewer.click('#reactionStrip button[aria-label="Send fire reaction"]');
    await viewer.waitForSelector('#reactionLayer .reaction-burst[data-reaction="fire"]');

    await host.evaluate(() => {
        renderMsg({
            id: 'qa-moderation-message',
            username: 'Viewer QA',
            text: 'moderate me',
            timestamp: Date.now(),
            sessionId: 'viewer-qa-session',
            moderationToken: 'viewer-qa-token',
            isHost: false
        });
    });
    await host.waitForSelector('#chatMessages .mod-actions button[aria-label="Ban Viewer QA"]');
    await host.evaluate(() => {
        window.__chatDownloads = [];
        window.__originalDownloadBlob = downloadBlob;
        downloadBlob = (filename, type, content) => window.__chatDownloads.push({ filename, type, content });
    });
    await host.click('#chatActions button:has-text("JSON")');
    await host.click('#chatActions button:has-text("TXT")');
    const chatDownloads = await host.evaluate(() => {
        const downloads = window.__chatDownloads;
        downloadBlob = window.__originalDownloadBlob;
        delete window.__chatDownloads;
        delete window.__originalDownloadBlob;
        return downloads;
    });
    assert.equal(chatDownloads.length, 2);
    const chatJsonDownload = chatDownloads.find(download => download.type === 'application/json');
    assert.match(chatJsonDownload.filename, new RegExp(`^${room}-chat-.*\\.json$`));
    const exportedChat = JSON.parse(chatJsonDownload.content);
    assert.equal(exportedChat.room, room);
    const exportedModerationMessage = exportedChat.messages.find(message => message.text === 'moderate me');
    assert.equal(exportedModerationMessage.username, 'Viewer QA');
    assert.equal(Object.hasOwn(exportedModerationMessage, 'sessionId'), false);
    assert.equal(Object.hasOwn(exportedModerationMessage, 'moderationToken'), false);

    const chatTxtDownload = chatDownloads.find(download => download.type === 'text/plain');
    assert.match(chatTxtDownload.filename, new RegExp(`^${room}-chat-.*\\.txt$`));
    assert.match(chatTxtDownload.content, /Viewer QA: moderate me/);

    await host.click('#chatMessages .mod-actions button[aria-label="Ban Viewer QA"]');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Ban applied to Viewer QA')));
    await viewer.evaluate(() => {
        handleModerationRecord({
            action: 'ban',
            actionId: 'qa-ban',
            target: localStorage.getItem('ms-mod-token'),
            label: 'Viewer QA',
            by: 'host',
            at: Date.now(),
            expiresAt: 0
        });
    });
    await viewer.waitForFunction(() => document.body.classList.contains('moderated-mode'));
    assert.equal(await viewer.getAttribute('#moderationNotice', 'aria-hidden'), 'false');
    assert.equal(await viewer.locator('#messageInput').isDisabled(), true);

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
