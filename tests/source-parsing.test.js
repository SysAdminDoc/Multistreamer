const assert = require('node:assert/strict');
const test = require('node:test');

const Sources = require('../stream-sources.js');

test('parses existing YouTube URL shapes and raw video ids', () => {
    assert.deepEqual(Sources.parseStreamUrl('dQw4w9WgXcQ'), {
        id: 'dQw4w9WgXcQ',
        type: 'youtube',
        sourceId: 'dQw4w9WgXcQ',
        sourceKind: 'video',
        displayName: 'YouTube dQw4w9WgXcQ'
    });
    assert.equal(Sources.parseStreamUrl('https://youtu.be/dQw4w9WgXcQ?t=10').sourceId, 'dQw4w9WgXcQ');
    assert.equal(Sources.parseStreamUrl('https://www.youtube.com/live/dQw4w9WgXcQ').sourceId, 'dQw4w9WgXcQ');
});

test('parses Twitch channel URLs into stable room records', () => {
    const source = Sources.parseStreamUrl('https://www.twitch.tv/TwitchDev');
    assert.equal(source.id, 'twitch-twitchdev');
    assert.equal(source.type, 'twitch');
    assert.equal(source.sourceId, 'twitchdev');
    assert.equal(source.sourceKind, 'channel');

    const record = Sources.streamToGunRecord(source, 1234);
    assert.deepEqual(record, {
        id: 'twitch-twitchdev',
        type: 'twitch',
        sourceId: 'twitchdev',
        sourceKind: 'channel',
        addedAt: 1234,
        muted: true,
        label: ''
    });
});

test('parses Twitch VOD URLs', () => {
    const source = Sources.parseStreamUrl('twitch.tv/videos/123456789');
    assert.equal(source.id, 'twitch-vod-123456789');
    assert.equal(source.sourceId, 'v123456789');
    assert.equal(source.sourceKind, 'video');
});

test('parses direct Rumble embed URLs', () => {
    const source = Sources.parseStreamUrl('https://rumble.com/embed/v1io41/');
    assert.equal(source.id, 'rumble-v1io41');
    assert.equal(source.type, 'rumble');
    assert.equal(source.sourceId, 'v1io41');
    assert.equal(source.sourceKind, 'embed');
});

test('parses HLS playlist URLs', () => {
    const source = Sources.parseStreamUrl('https://example.com/live/camera.m3u8?token=abc');
    assert.match(source.id, /^hls-[a-z0-9]+$/);
    assert.equal(source.type, 'hls');
    assert.equal(source.sourceId, 'https://example.com/live/camera.m3u8?token=abc');
    assert.equal(source.sourceKind, 'playlist');
});

test('parses DASH manifest URLs', () => {
    const source = Sources.parseStreamUrl('https://example.com/live/manifest.mpd?token=abc');
    assert.match(source.id, /^dash-[a-z0-9]+$/);
    assert.equal(source.type, 'dash');
    assert.equal(source.sourceId, 'https://example.com/live/manifest.mpd?token=abc');
    assert.equal(source.sourceKind, 'manifest');
    assert.equal(source.displayName, 'DASH: example.com');
});

test('parses allowlisted iframe embed URLs only with an explicit prefix', () => {
    const source = Sources.parseStreamUrl('iframe:https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5');
    assert.match(source.id, /^iframe-[a-z0-9]+$/);
    assert.equal(source.type, 'iframe');
    assert.equal(source.sourceKind, 'embed');
    assert.equal(source.sourceId, 'https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5');
    assert.equal(source.displayName, 'Embed: Windy');

    assert.equal(Sources.parseStreamUrl('https://embed.windy.com/embed2.html?lat=40.7'), null);
    assert.equal(Sources.parseStreamUrl('iframe:http://embed.windy.com/embed2.html'), null);
    assert.equal(Sources.parseStreamUrl('iframe:https://example.com/embed.html'), null);
});

test('normalizes legacy YouTube records without type fields', () => {
    const stream = Sources.normalizeStreamRecord({ id: 'dQw4w9WgXcQ', muted: false, label: 'Main' }, 'dQw4w9WgXcQ');
    assert.equal(stream.type, 'youtube');
    assert.equal(stream.sourceId, 'dQw4w9WgXcQ');
    assert.equal(stream.muted, false);
    assert.equal(stream.label, 'Main');
});

test('builds Twitch embed and chat URLs with a parent domain', () => {
    const source = Sources.parseStreamUrl('https://www.twitch.tv/twitchdev');
    const record = Sources.streamToGunRecord(source, 1234);
    const embed = Sources.buildEmbed(record, { parent: 'example.com' });

    assert.equal(embed.type, 'twitch');
    assert.equal(embed.title, 'Twitch channel twitchdev');
    assert.equal(embed.loading, 'lazy');
    assert.match(embed.sandbox, /allow-scripts/);
    assert.equal(embed.referrerPolicy, 'strict-origin-when-cross-origin');
    assert.match(embed.videoUrl, /^https:\/\/player\.twitch\.tv\/\?/);
    assert.match(embed.videoUrl, /parent=example\.com/);
    assert.match(embed.videoUrl, /channel=twitchdev/);
    assert.equal(embed.chatUrl, 'https://www.twitch.tv/embed/twitchdev/chat?parent=example.com');
    assert.equal(embed.chatTitle, 'Twitch chat twitchdev');
    assert.match(embed.chatSandbox, /allow-forms/);
});

test('builds YouTube embed URLs from normalized records', () => {
    const embed = Sources.buildEmbed({ id: 'dQw4w9WgXcQ', muted: true }, { parent: 'example.com' });
    assert.equal(embed.title, 'YouTube video dQw4w9WgXcQ');
    assert.equal(embed.loading, 'lazy');
    assert.match(embed.sandbox, /allow-presentation/);
    assert.equal(embed.referrerPolicy, 'strict-origin-when-cross-origin');
    assert.equal(embed.videoUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1');
    assert.equal(embed.chatUrl, '');
});

test('builds Rumble embed URLs', () => {
    const rumble = Sources.buildEmbed(Sources.streamToGunRecord(Sources.parseStreamUrl('rumble:v1io41')), {});
    assert.equal(rumble.title, 'Rumble video v1io41');
    assert.equal(rumble.loading, 'lazy');
    assert.match(rumble.sandbox, /allow-scripts/);
    assert.equal(rumble.videoUrl, 'https://rumble.com/embed/v1io41/');
    assert.equal(rumble.chatUrl, '');
});

test('builds HLS media records', () => {
    const hls = Sources.buildEmbed(Sources.streamToGunRecord(Sources.parseStreamUrl('https://example.com/live/camera.m3u8')), {});
    assert.equal(hls.type, 'hls');
    assert.equal(hls.mediaUrl, 'https://example.com/live/camera.m3u8');
    assert.equal(hls.videoUrl, '');
});

test('builds DASH media records', () => {
    const dash = Sources.buildEmbed(Sources.streamToGunRecord(Sources.parseStreamUrl('https://example.com/live/manifest.mpd')), {});
    assert.equal(dash.type, 'dash');
    assert.equal(dash.title, 'DASH stream https://example.com/live/manifest.mpd');
    assert.equal(dash.mediaUrl, 'https://example.com/live/manifest.mpd');
    assert.equal(dash.videoUrl, '');
});

test('builds allowlisted iframe embed records with sandbox policy', () => {
    const source = Sources.parseStreamUrl('embed:https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5');
    const embed = Sources.buildEmbed(Sources.streamToGunRecord(source), {});
    assert.equal(embed.type, 'iframe');
    assert.equal(embed.title, 'Windy embed');
    assert.equal(embed.videoUrl, 'https://embed.windy.com/embed2.html?lat=40.7&lon=-74&zoom=5');
    assert.match(embed.sandbox, /allow-scripts/);
    assert.match(embed.sandbox, /allow-forms/);
    assert.equal(embed.referrerPolicy, 'strict-origin-when-cross-origin');
});
