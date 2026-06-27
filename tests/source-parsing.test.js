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
    assert.match(embed.videoUrl, /^https:\/\/player\.twitch\.tv\/\?/);
    assert.match(embed.videoUrl, /parent=example\.com/);
    assert.match(embed.videoUrl, /channel=twitchdev/);
    assert.equal(embed.chatUrl, 'https://www.twitch.tv/embed/twitchdev/chat?parent=example.com');
});

test('builds YouTube embed URLs from normalized records', () => {
    const embed = Sources.buildEmbed({ id: 'dQw4w9WgXcQ', muted: true }, { parent: 'example.com' });
    assert.equal(embed.videoUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1');
    assert.equal(embed.chatUrl, '');
});

test('builds Rumble embed URLs', () => {
    const rumble = Sources.buildEmbed(Sources.streamToGunRecord(Sources.parseStreamUrl('rumble:v1io41')), {});
    assert.equal(rumble.videoUrl, 'https://rumble.com/embed/v1io41/');
    assert.equal(rumble.chatUrl, '');
});
