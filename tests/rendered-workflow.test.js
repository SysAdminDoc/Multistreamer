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
    let persistedSnapshot = null;
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
    await context.route(/https:\/\/www\.ventusky\.com\/.*/, route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Ventusky stub</title>'
    }));
    await context.route('https://api.weather.gov/alerts/active**', route => route.fulfill({
        status: 200,
        contentType: 'application/geo+json',
        body: JSON.stringify({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        event: 'Flood Warning',
                        severity: 'Severe',
                        urgency: 'Immediate',
                        headline: 'Flood Warning issued for QA County',
                        areaDesc: 'QA County',
                        instruction: 'Move to higher ground now.',
                        expires: '2030-01-01T12:00:00-05:00'
                    }
                }
            ]
        })
    }));
    await context.route('https://persist.supabase.co/rest/v1/room_snapshots**', async route => {
        const request = route.request();
        if (request.method() === 'POST') {
            persistedSnapshot = JSON.parse(request.postData() || '{}');
            return route.fulfill({ status: 201, contentType: 'application/json', body: '' });
        }
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(persistedSnapshot ? [{ config: persistedSnapshot.config }] : [])
        });
    });

    const room = 'rendered-' + Date.now();
    const hostKey = 'host-' + Date.now();
    const host = await context.newPage();
    await host.goto(`${baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await host.waitForSelector('#viewerPage.active');
    await host.waitForFunction(() => document.body.classList.contains('viewer-mode') === false);
    await host.waitForFunction(() => !new URL(location.href).searchParams.has('host'));
    const hostAuthState = await host.evaluate(async roomName => {
        const once = node => new Promise(resolve => node.once(value => resolve(value)));
        const meta = gun.get('ms4-' + roomName).get('meta');
        return {
            localKey: localStorage.getItem(`ms-host-key-${roomName}`),
            hash: await once(meta.get('hostKeyHash')),
            legacyKey: await once(meta.get('hostKey')),
            search: location.search
        };
    }, room);
    assert.equal(hostAuthState.localKey, hostKey);
    assert.equal(hostAuthState.search, `?room=${room}`);
    assert.equal(typeof hostAuthState.hash, 'string');
    assert.equal(hostAuthState.hash.length, 64);
    assert.notEqual(hostAuthState.hash, hostKey);
    assert.equal(hostAuthState.legacyKey == null, true);

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

    const activeScheduleStart = Date.now() - 60_000;
    await host.fill('#importData', JSON.stringify({
        version: 15,
        room,
        streams: [
            { id: 'dQw4w9WgXcQ', type: 'youtube', sourceId: 'dQw4w9WgXcQ', sourceKind: 'video', muted: true, volume: 0, label: 'Workflow QA', latencyOffsetMs: 0, geo: { lat: 41.25, lon: -72.5 } },
            { id: '9bZkp7q19f0', type: 'youtube', sourceId: '9bZkp7q19f0', sourceKind: 'video', muted: true, volume: 0, label: 'Mobile Secondary', latencyOffsetMs: 0 },
            { id: 'bad-hls', type: 'hls', sourceId: 'not-a-url', sourceKind: 'playlist' }
        ],
        settings: {
            layout: 'grid',
            featuredId: 'dQw4w9WgXcQ',
            grid: { preset: 'custom', customTemplate: 'minmax(0, 2fr) minmax(220px, 1fr)' },
            schedule: { enabled: true, startsAt: activeScheduleStart, durationHours: 1 },
            weather: { enabled: true, provider: 'ventusky', lat: 41.25, lon: -72.5 },
            chat: { slowModeSeconds: 5, rateLimitCount: 3, rateLimitSeconds: 30 },
            display: { gridGap: 4, labels: 'always', audioOnly: false, theme: 'amoled', accent: '#00d4ff' }
        }
    }));
    await host.click('#importModal .btn-primary');
    await host.waitForSelector('.grid-item[data-provider="youtube"]');
    await host.waitForSelector('#scheduleBanner.show[data-state="open"]');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Skipped 1 invalid stream')));
    assert.equal(await host.locator('.grid-item[data-stream-id="bad-hls"]').count(), 0);
    await host.waitForSelector('iframe[src*="ventusky.com"]');
    await host.waitForSelector('#streamMinimap.show .stream-map-marker[title*="Workflow QA"]');
    await host.click('.grid-item[data-provider="youtube"] button:has-text("Geo")');
    await host.waitForSelector('#geoModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'geoLatInput');
    await host.fill('#geoLatInput', '39.7456');
    await host.fill('#geoLonInput', '-97.0892');
    await host.click('#geoModal .btn-primary');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Stream location saved')));
    await host.waitForSelector('#streamMinimap .stream-map-marker[title*="39.7456"]');
    await host.click('button:has-text("Fetch NWS Alerts")');
    await host.waitForSelector('#incidentAlertBar.show');
    assert.match(await host.textContent('#incidentAlertText'), /Flood Warning issued for QA County/);
    assert.match(await host.textContent('#nwsAlertStatus'), /NWS alert pinned/);
    await host.selectOption('#persistenceProvider', 'supabase');
    await host.fill('#persistenceEndpoint', 'https://persist.supabase.co');
    await host.fill('#persistenceKey', 'anon-test-key');
    await host.click('button:has-text("Save Local Settings")');
    await host.click('button:has-text("Push Snapshot")');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Room snapshot pushed')));
    assert.equal(persistedSnapshot.room_id, room);
    assert.equal(persistedSnapshot.config.version, 15);
    assert.equal(persistedSnapshot.config.settings.schedule.enabled, true);
    assert.equal(persistedSnapshot.config.streams[0].geo.lat, 39.7456);

    await host.waitForFunction(roomName => {
        const snapshot = JSON.parse(localStorage.getItem(`ms-room-cache-${roomName}`) || 'null');
        return snapshot?.appVersion === '0.36.0'
            && snapshot?.cacheVersion === 1
            && snapshot?.config?.version === 15
            && snapshot?.config?.settings?.schedule?.enabled === true
            && snapshot?.config?.streams?.some(stream => stream.id === 'dQw4w9WgXcQ');
    }, room);
    const offlineSnapshot = await host.evaluate(roomName => JSON.parse(localStorage.getItem(`ms-room-cache-${roomName}`)), room);
    assert.equal(offlineSnapshot.meta.title, room);
    assert.equal(offlineSnapshot.config.settings.grid.preset, 'custom');
    assert.equal(offlineSnapshot.config.streams.length >= 2, true);

    await host.check('#audioOnlyToggle');
    await host.waitForSelector('#gridContainer.audio-only-layout');
    await host.waitForFunction(() => settings.display.audioOnly === true);
    const audioOnlyLayout = await host.evaluate(() => {
        const embed = document.querySelector('#gridContainer.audio-only-layout .stream-embed');
        const slider = document.querySelector('#gridContainer.audio-only-layout .volume-slider');
        return {
            checked: document.getElementById('audioOnlyToggle').checked,
            streamTiles: document.querySelectorAll('#gridContainer.audio-only-layout .grid-item[data-stream-id]').length,
            weatherTiles: document.querySelectorAll('#gridContainer.audio-only-layout .grid-item[data-provider="weather"]').length,
            embedOpacity: getComputedStyle(embed).opacity,
            embedWidth: embed.getBoundingClientRect().width,
            sliderWidth: slider.getBoundingClientRect().width
        };
    });
    assert.equal(audioOnlyLayout.checked, true);
    assert.equal(audioOnlyLayout.streamTiles >= 2, true);
    assert.equal(audioOnlyLayout.weatherTiles, 0);
    assert.equal(audioOnlyLayout.embedOpacity, '0');
    assert.ok(audioOnlyLayout.embedWidth <= 2);
    assert.ok(audioOnlyLayout.sliderWidth >= 140);
    await host.uncheck('#audioOnlyToggle');
    await host.waitForFunction(() => settings.display.audioOnly === false && !document.getElementById('gridContainer').classList.contains('audio-only-layout'));

    await host.fill('#clipTitleInput', 'Opening moment');
    await host.click('#settingsPanel button:has-text("Add Clip Bookmark")');
    await host.waitForFunction(() => clipBookmarks.size === 1 && document.querySelectorAll('#clipList .clip-card').length === 1);
    const clipState = await host.evaluate(() => {
        const clip = Array.from(clipBookmarks.values())[0];
        return {
            count: clipBookmarks.size,
            id: clip.id,
            title: clip.title,
            streamId: clip.streamId,
            shareUrl: getClipShareUrl(clip.id)
        };
    });
    assert.equal(clipState.count, 1);
    assert.equal(clipState.title, 'Opening moment');
    assert.equal(clipState.streamId, 'dQw4w9WgXcQ');
    const clipUrl = new URL(clipState.shareUrl);
    assert.equal(clipUrl.searchParams.get('room'), room);
    assert.equal(clipUrl.searchParams.get('clip'), clipState.id);
    await host.evaluate(() => {
        window.__clipDownloads = [];
        window.__originalDownloadBlob = downloadBlob;
        downloadBlob = (filename, type, content) => window.__clipDownloads.push({ filename, type, content });
    });
    await host.click('#settingsPanel button:has-text("Export Clips")');
    const clipDownloads = await host.evaluate(() => {
        const downloads = window.__clipDownloads;
        downloadBlob = window.__originalDownloadBlob;
        delete window.__clipDownloads;
        delete window.__originalDownloadBlob;
        return downloads;
    });
    assert.equal(clipDownloads.length, 1);
    assert.equal(clipDownloads[0].filename, `${room}-clips.json`);
    assert.equal(clipDownloads[0].type, 'application/json');
    const exportedClips = JSON.parse(clipDownloads[0].content);
    assert.equal(exportedClips.version, '0.36.0');
    assert.equal(exportedClips.room, room);
    assert.equal(exportedClips.clips[0].title, 'Opening moment');
    assert.equal(exportedClips.clips[0].shareUrl, clipState.shareUrl);

    await host.click('.grid-item[data-provider="youtube"] button:has-text("Offset")');
    await host.waitForSelector('#latencyOffsetModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'latencyOffsetInput');
    await host.fill('#latencyOffsetInput', '2.5');
    await host.click('#latencyOffsetModal .btn-primary');
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('Latency offset saved')));
    await host.waitForFunction(() => document.querySelector('.latency-offset-badge')?.textContent === '+2.5s');
    await host.locator('.grid-item[data-stream-id="dQw4w9WgXcQ"] .volume-slider').fill('60');
    await host.waitForFunction(() => document.querySelector('.grid-item[data-stream-id="dQw4w9WgXcQ"] .volume-slider')?.value === '60');
    const liveChatId = await host.evaluate(async () => {
        const originalFetch = window.fetch;
        youtubeChatMirror.apiKey = 'test-key';
        window.fetch = async () => ({
            ok: true,
            json: async () => ({ items: [{ liveStreamingDetails: { activeLiveChatId: 'live-chat-1' } }] })
        });
        const id = await fetchYouTubeLiveChatId({ sourceId: 'dQw4w9WgXcQ' });
        window.fetch = originalFetch;
        return id;
    });
    assert.equal(liveChatId, 'live-chat-1');
    await host.evaluate(() => {
        mirrorYouTubeChatMessage({
            id: 'yt-rendered-message',
            snippet: { displayMessage: 'hello from youtube', publishedAt: new Date().toISOString() },
            authorDetails: { displayName: 'YT User' }
        });
    });
    await host.waitForFunction(() => Array.from(document.querySelectorAll('#chatMessages .chat-msg')).some(msg => msg.textContent.includes('hello from youtube') && msg.textContent.includes('YouTube')));

    const [download] = await Promise.all([
        host.waitForEvent('download'),
        host.click('.settings-actions .btn-primary', { noWaitAfter: true })
    ]);
    assert.equal(download.suggestedFilename(), `${room}.json`);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.version, 15);
    assert.deepEqual(exported.settings.grid, { preset: 'custom', customTemplate: 'minmax(0, 2fr) minmax(220px, 1fr)' });
    assert.equal(exported.settings.schedule.enabled, true);
    assert.equal(exported.settings.schedule.startsAt, activeScheduleStart);
    assert.equal(exported.settings.schedule.durationHours, 1);
    assert.deepEqual(exported.settings.weather, { enabled: true, provider: 'ventusky', lat: 41.25, lon: -72.5 });
    assert.equal(exported.settings.incident.enabled, true);
    assert.equal(exported.settings.incident.event, 'Flood Warning');
    assert.deepEqual(exported.settings.chat, { slowModeSeconds: 5, rateLimitCount: 3, rateLimitSeconds: 30 });
    assert.equal(exported.settings.display.audioOnly, false);
    const exportedWorkflowStream = exported.streams.find(stream => stream.id === 'dQw4w9WgXcQ');
    assert.equal(exportedWorkflowStream.latencyOffsetMs, 2500);
    assert.equal(exportedWorkflowStream.volume, 60);
    assert.deepEqual(exportedWorkflowStream.geo, { lat: 39.7456, lon: -97.0892 });

    await host.click('button:has-text("Share")');
    await host.waitForSelector('#shareModal.show');
    assert.equal(await host.evaluate(() => document.activeElement.id), 'shareViewerLink');
    await host.keyboard.press('Tab');
    assert.equal(await host.evaluate(() => document.getElementById('shareModal').contains(document.activeElement)), true);
    await host.keyboard.press('Escape');
    await host.waitForFunction(() => document.getElementById('shareModal').getAttribute('aria-hidden') === 'true');
    assert.equal(await host.evaluate(() => document.activeElement.textContent.trim()), 'Share');

    const futureSchedule = { enabled: true, startsAt: Date.now() + 60 * 60 * 1000, durationHours: 1 };
    await host.evaluate(schedule => roomRef.get('settings').get('schedule').put(schedule), futureSchedule);
    await host.waitForSelector('#scheduleBanner.show[data-state="scheduled"]');
    const scheduledContext = await browser.newContext();
    const scheduledViewer = await scheduledContext.newPage();
    await scheduledViewer.goto(`${baseUrl}/?room=${room}`, { waitUntil: 'domcontentloaded' });
    await scheduledViewer.waitForSelector('#scheduleBanner.show[data-state="scheduled"]');
    assert.match(await scheduledViewer.textContent('.empty-state'), /This room opens/);
    assert.equal(await scheduledViewer.locator('.grid-item[data-provider="youtube"]').count(), 0);
    await scheduledViewer.click('#reactionStrip button[aria-label="Send fire reaction"]');
    await scheduledViewer.waitForFunction(() => Array.from(document.querySelectorAll('#toastRegion .toast')).some(t => t.textContent.includes('available when the room is live')));
    await scheduledContext.close();

    const closedSchedule = { enabled: true, startsAt: Date.now() - 2 * 60 * 60 * 1000, durationHours: 0.25 };
    await host.evaluate(schedule => roomRef.get('settings').get('schedule').put(schedule), closedSchedule);
    await host.waitForSelector('#scheduleBanner.show[data-state="closed"]');
    const closedContext = await browser.newContext();
    const closedViewer = await closedContext.newPage();
    await closedViewer.goto(`${baseUrl}/?room=${room}`, { waitUntil: 'domcontentloaded' });
    await closedViewer.waitForSelector('#scheduleBanner.show[data-state="closed"]');
    assert.match(await closedViewer.textContent('.empty-state'), /This room is closed/);
    await closedContext.close();

    await host.evaluate(() => roomRef.get('settings').get('schedule').put({ enabled: false, startsAt: 0, durationHours: 1 }));
    await host.waitForFunction(() => !document.getElementById('scheduleBanner').classList.contains('show'));
    await host.click('#settingsPanel .settings-header button');
    await host.waitForFunction(() => !document.getElementById('settingsPanel').classList.contains('open'));

    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`${baseUrl}/?room=${room}`, { waitUntil: 'domcontentloaded' });
    await viewer.waitForSelector('#viewerPage.active');
    await viewer.waitForFunction(() => document.body.classList.contains('viewer-mode'));
    assert.equal(await viewer.evaluate(roomName => localStorage.getItem(`ms-host-key-${roomName}`)), null);
    assert.equal(await viewer.locator('.control-bar').isVisible(), false);
    await viewer.click('#reactionStrip button[aria-label="Send fire reaction"]');
    await viewer.waitForSelector('#reactionLayer .reaction-burst[data-reaction="fire"]');
    const slowModeGate = await viewer.evaluate(() => {
        const now = Date.now();
        settings.chat.slowModeSeconds = 5;
        chatSendTimes = [];
        recordChatSend(now);
        return checkChatSendAllowed(now + 1000);
    });
    assert.equal(slowModeGate.ok, false);
    assert.match(slowModeGate.message, /Slow mode/);
    const rateLimitGate = await viewer.evaluate(() => {
        const now = Date.now();
        settings.chat.slowModeSeconds = 0;
        settings.chat.rateLimitCount = 3;
        settings.chat.rateLimitSeconds = 30;
        chatSendTimes = [now - 3000, now - 2000, now - 1000];
        return checkChatSendAllowed(now);
    });
    assert.equal(rateLimitGate.ok, false);
    assert.match(rateLimitGate.message, /Rate limit/);

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

    await viewerContext.close();
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${baseUrl}/?room=${room}&host=${hostKey}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#viewerPage.active');
    await mobilePage.waitForFunction(() => document.body.classList.contains('viewer-mode') === false);
    await mobilePage.waitForFunction(() => !new URL(location.href).searchParams.has('host'));
    await mobilePage.evaluate(() => {
        settings.layout = 'featured';
        settings.featuredId = 'dQw4w9WgXcQ';
        settings.weather = { enabled: false, provider: 'windy', lat: 40.7128, lon: -74.006 };
        streams = [
            { id: 'dQw4w9WgXcQ', type: 'youtube', sourceId: 'dQw4w9WgXcQ', sourceKind: 'video', muted: true, volume: 0, label: 'Mobile Primary', addedAt: 1 },
            { id: '9bZkp7q19f0', type: 'youtube', sourceId: '9bZkp7q19f0', sourceKind: 'video', muted: true, volume: 0, label: 'Mobile Secondary', addedAt: 2 }
        ];
        render();
    });
    await mobilePage.waitForSelector('#gridContainer.layout-featured .sidebar-stack');
    const mobileLayout = await mobilePage.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        titleWidth: document.getElementById('roomTitle').getBoundingClientRect().width,
        statusRight: document.querySelector('.top-status').getBoundingClientRect().right,
        viewportWidth: window.innerWidth,
        mainOverflowY: getComputedStyle(document.querySelector('.main-content')).overflowY,
        gridDisplay: getComputedStyle(document.getElementById('gridContainer')).display,
        featuredPosition: getComputedStyle(document.querySelector('#gridContainer.layout-featured > .grid-item')).position,
        featuredTop: getComputedStyle(document.querySelector('#gridContainer.layout-featured > .grid-item')).top,
        sidebarDisplay: getComputedStyle(document.querySelector('#gridContainer.layout-featured .sidebar-stack')).display,
        sidebarBelowFeatured: document.querySelector('#gridContainer.layout-featured .sidebar-stack').getBoundingClientRect().top >= document.querySelector('#gridContainer.layout-featured > .grid-item').getBoundingClientRect().bottom - 1
    }));
    assert.equal(mobileLayout.overflow, 0);
    assert.ok(mobileLayout.titleWidth > 120);
    assert.ok(mobileLayout.statusRight <= mobileLayout.viewportWidth);
    assert.equal(mobileLayout.mainOverflowY, 'auto');
    assert.equal(mobileLayout.gridDisplay, 'flex');
    assert.equal(mobileLayout.featuredPosition, 'sticky');
    assert.equal(mobileLayout.featuredTop, '0px');
    assert.equal(mobileLayout.sidebarDisplay, 'flex');
    assert.equal(mobileLayout.sidebarBelowFeatured, true);
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
    if (filePath.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
}
