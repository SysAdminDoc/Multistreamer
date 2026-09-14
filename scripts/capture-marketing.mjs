import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const Gun = require('gun');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screenshotDir = path.join(root, 'assets', 'screenshots');
const archiveDir = path.join(root, 'assets', 'concepts', '2026-09-14-marketing', 'screenshots');
const localChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(archiveDir, { recursive: true });

let browser;
let server;

try {
    const started = await startServer();
    server = started.server;
    browser = await chromium.launch({
        headless: true,
        ...(localChromium && fs.existsSync(localChromium) ? { executablePath: localChromium } : {})
    });

    const room = 'portfolio-preview';
    const hostKey = 'local-capture-key';
    const desktop = await createContext(started.relayUrl, { viewport: { width: 1600, height: 1000 } });
    const page = await desktop.newPage();
    await prepareSampleRoutes(desktop);
    await page.goto(`${started.baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#viewerPage.active');
    await page.waitForFunction(() => !document.body.classList.contains('viewer-mode'));

    await page.click('button:has-text("Settings")');
    await page.click('.settings-actions button:has-text("Import")');
    await page.fill('#importData', JSON.stringify(sampleConfig(room)));
    await page.click('#importModal .btn-primary');
    await page.waitForFunction(() => document.querySelectorAll('.grid-item[data-provider="youtube"]').length === 3);
    await page.click('#settingsPanel .settings-header button');
    await page.waitForFunction(() => !document.getElementById('settingsPanel').classList.contains('open'));

    await page.click('.edit-title-btn');
    await page.fill('#roomTitleInput', 'Live Operations Room');
    await page.locator('#roomTitleInput').evaluate(element => element.blur());
    await page.waitForFunction(() => document.getElementById('roomTitle').textContent === 'Live Operations Room');

    await page.click('button:has-text("Settings")');
    await page.click('.settings-section:first-child button:has-text("Edit")');
    await page.fill('#announcementInput', 'SAMPLE DATA | Marketing preview | No live media');
    await page.click('#announcementModal .btn-primary');
    await page.waitForSelector('#announcementBar.show');
    await page.click('#settingsPanel .settings-header button');
    await page.waitForFunction(() => !document.getElementById('settingsPanel').classList.contains('open'));

    await page.fill('#usernameInput', 'Production Desk');
    await page.click('#chatBtn');
    await page.fill('#messageInput', 'All sample feeds are checked and ready.');
    await page.click('#chatBtn');

    await page.evaluate(() => document.querySelectorAll('#toastRegion .toast').forEach(toast => toast.remove()));
    await page.waitForTimeout(900);
    await capture(page, 'control-room.png');

    await page.click('button:has-text("Settings")');
    await page.waitForSelector('#settingsPanel.open');
    await page.evaluate(() => document.querySelector('.settings-content').scrollTop = 0);
    await page.evaluate(() => document.querySelectorAll('#toastRegion .toast').forEach(toast => toast.remove()));
    await page.waitForTimeout(300);
    await capture(page, 'settings.png');
    await desktop.close();

    const mobile = await createContext(started.relayUrl, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await prepareSampleRoutes(mobile);
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${started.baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#viewerPage.active');
    await mobilePage.waitForFunction(() => document.querySelectorAll('.grid-item[data-provider="youtube"]').length === 3);
    await mobilePage.waitForSelector('#gridContainer.layout-featured .sidebar-stack');
    await mobilePage.evaluate(() => document.querySelectorAll('#toastRegion .toast').forEach(toast => toast.remove()));
    await mobilePage.waitForTimeout(900);
    await capture(mobilePage, 'mobile.png');
    await mobile.close();

    await browser.close();
    await new Promise(resolve => server.close(resolve));
    console.log('Captured control-room.png, settings.png, and mobile.png');
    process.exit(0);
} catch (error) {
    console.error(error);
    await browser?.close();
    await new Promise(resolve => server?.close(resolve));
    process.exit(1);
}

function sampleConfig(room) {
    return {
        version: 16,
        room,
        streams: [
            { id: 'dQw4w9WgXcQ', type: 'youtube', sourceId: 'dQw4w9WgXcQ', sourceKind: 'video', muted: true, volume: 0, label: 'Program Feed | Sample', addedAt: 1 },
            { id: '9bZkp7q19f0', type: 'youtube', sourceId: '9bZkp7q19f0', sourceKind: 'video', muted: true, volume: 0, label: 'Field Camera | Sample', addedAt: 2 },
            { id: 'aqz-KE-bpKQ', type: 'youtube', sourceId: 'aqz-KE-bpKQ', sourceKind: 'video', muted: true, volume: 0, label: 'Event Data | Sample', addedAt: 3 }
        ],
        settings: {
            layout: 'featured',
            featuredId: 'dQw4w9WgXcQ',
            grid: { preset: 'auto', customTemplate: '' },
            schedule: { enabled: false, startsAt: 0, durationHours: 1 },
            weather: { enabled: false, provider: 'windy', lat: 40.7128, lon: -74.006 },
            incident: { enabled: false, text: '', event: '', severity: '', headline: '', area: '', updatedAt: 0, expiresAt: 0 },
            chat: { slowModeSeconds: 0, rateLimitCount: 5, rateLimitSeconds: 30 },
            display: { gridGap: 6, labels: 'always', audioOnly: false, theme: 'midnight', accent: '#2ad4ff' },
            stats: { enabled: false, refreshSeconds: 60 }
        }
    };
}

async function createContext(relayUrl, options) {
    const context = await browser.newContext(options);
    await context.addInitScript(url => {
        window.MULTISTREAMER_RELAYS = [url];
    }, relayUrl);
    return context;
}

async function prepareSampleRoutes(context) {
    await context.route('https://www.youtube.com/**', route => {
        const url = new URL(route.request().url());
        const id = url.pathname.split('/').filter(Boolean).at(-1) || '';
        route.fulfill({ status: 200, contentType: 'text/html', body: sampleFeed(id) });
    });
}

function sampleFeed(id) {
    const variants = {
        dQw4w9WgXcQ: ['PROGRAM', 'Main stage', '#2ad4ff', 'LIVE MIX'],
        '9bZkp7q19f0': ['FIELD 02', 'North entrance', '#36e3b6', 'CAMERA'],
        'aqz-KE-bpKQ': ['EVENT DATA', 'Capacity and timing', '#8174ff', 'STATUS']
    };
    const [eyebrow, title, accent, label] = variants[id] || ['SAMPLE FEED', 'Preview source', '#2ad4ff', 'DEMO'];
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>
        *{box-sizing:border-box}body{margin:0;overflow:hidden;background:#081325;color:#f6f9ff;font-family:Inter,Segoe UI,Arial,sans-serif}
        .scene{position:relative;height:100vh;min-height:180px;padding:22px;background:radial-gradient(circle at 72% 22%,${accent}44,transparent 33%),linear-gradient(145deg,#0d1f3d,#081325 58%,#101a33)}
        .grid{position:absolute;inset:0;opacity:.15;background-image:linear-gradient(${accent} 1px,transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px);background-size:42px 42px;transform:perspective(500px) rotateX(60deg) scale(1.5);transform-origin:bottom}
        .top,.bottom{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between}.eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;color:${accent}}
        .sample{padding:6px 9px;border:1px solid ${accent}66;border-radius:999px;background:#07101fcc;font-size:9px;font-weight:800;letter-spacing:.12em}
        .focus{position:absolute;z-index:2;left:7%;right:7%;top:30%;bottom:20%;display:flex;align-items:end;padding:24px;border:1px solid ${accent}55;border-radius:18px;background:linear-gradient(180deg,transparent,#07101fd9)}
        h1{margin:0;font-size:clamp(22px,5vw,54px);letter-spacing:-.04em}.bars{position:absolute;right:8%;bottom:24%;display:flex;align-items:end;gap:8px;height:30%}.bars i{display:block;width:13px;border-radius:5px 5px 2px 2px;background:${accent};box-shadow:0 0 20px ${accent}55}.bars i:nth-child(1){height:38%}.bars i:nth-child(2){height:74%}.bars i:nth-child(3){height:52%}.bars i:nth-child(4){height:92%}.bottom{position:absolute;left:22px;right:22px;bottom:16px;font-size:10px;color:#a9bad8}.dot{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#50f399;box-shadow:0 0 12px #50f399}
    </style></head><body><main class="scene"><div class="grid"></div><div class="top"><span class="eyebrow">${eyebrow}</span><span class="sample">SAMPLE FEED</span></div><div class="focus"><h1>${title}</h1></div><div class="bars"><i></i><i></i><i></i><i></i></div><div class="bottom"><span><span class="dot"></span>${label}</span><span>NO LIVE MEDIA</span></div></main></body></html>`;
}

async function capture(page, name) {
    const destination = path.join(screenshotDir, name);
    await page.screenshot({ path: destination, fullPage: false });
    fs.copyFileSync(destination, path.join(archiveDir, `raw-${name}`));
}

function startServer() {
    const localServer = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1');
        if (url.pathname.startsWith('/gun')) return;
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
    Gun({ web: localServer, file: false, radisk: false, localStorage: false });
    return new Promise(resolve => localServer.listen(0, '127.0.0.1', () => {
        const { port } = localServer.address();
        const baseUrl = `http://127.0.0.1:${port}`;
        resolve({ server: localServer, baseUrl, relayUrl: `${baseUrl}/gun` });
    }));
}

function contentType(filePath) {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
    if (filePath.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8';
    if (filePath.endsWith('.svg')) return 'image/svg+xml';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
}
