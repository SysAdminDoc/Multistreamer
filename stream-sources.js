(function initStreamSources(root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.MultiStreamSources = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createStreamSources(root) {
    const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
    const TWITCH_CHANNEL_RE = /^[A-Za-z0-9_]{3,25}$/;
    const TWITCH_VIDEO_RE = /^(?:v)?(\d+)$/i;
    const RUMBLE_EMBED_RE = /^v[A-Za-z0-9_-]+$/;
    const TWITCH_RESERVED_PATHS = new Set([
        'about',
        'activate',
        'bits',
        'creatorcamp',
        'dashboard',
        'directory',
        'downloads',
        'drops',
        'jobs',
        'login',
        'logout',
        'moderator',
        'p',
        'popout',
        'settings',
        'store',
        'subscriptions',
        'team',
        'turbo',
        'videos',
        'wallet'
    ]);

    function parseUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return null;

        try {
            return new URL(raw);
        } catch (_) {
            if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}([/:?#].*)?$/.test(raw)) {
                try {
                    return new URL('https://' + raw);
                } catch (_) {
                    return null;
                }
            }
        }
        return null;
    }

    function cleanPathParts(url) {
        return url.pathname
            .split('/')
            .map(part => decodeURIComponent(part.trim()))
            .filter(Boolean);
    }

    function makeYouTube(id) {
        return {
            id,
            type: 'youtube',
            sourceId: id,
            sourceKind: 'video',
            displayName: 'YouTube ' + id
        };
    }

    function makeTwitchChannel(channel) {
        const normalized = channel.toLowerCase();
        return {
            id: 'twitch-' + normalized,
            type: 'twitch',
            sourceId: normalized,
            sourceKind: 'channel',
            displayName: 'Twitch: ' + channel
        };
    }

    function makeTwitchVideo(videoId) {
        const id = videoId.replace(/^v/i, '');
        return {
            id: 'twitch-vod-' + id,
            type: 'twitch',
            sourceId: 'v' + id,
            sourceKind: 'video',
            displayName: 'Twitch VOD ' + id
        };
    }

    function makeRumbleEmbed(embedId) {
        return {
            id: 'rumble-' + embedId,
            type: 'rumble',
            sourceId: embedId,
            sourceKind: 'embed',
            displayName: 'Rumble ' + embedId
        };
    }

    function stableId(prefix, value) {
        let hash = 0;
        const raw = String(value || '');
        for (let i = 0; i < raw.length; i++) {
            hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
        }
        return prefix + '-' + Math.abs(hash).toString(36);
    }

    function makeHlsPlaylist(url) {
        return {
            id: stableId('hls', url.href),
            type: 'hls',
            sourceId: url.href,
            sourceKind: 'playlist',
            displayName: 'HLS: ' + (url.hostname || 'playlist')
        };
    }

    function makeDashManifest(url) {
        return {
            id: stableId('dash', url.href),
            type: 'dash',
            sourceId: url.href,
            sourceKind: 'manifest',
            displayName: 'DASH: ' + (url.hostname || 'manifest')
        };
    }

    function parseYouTube(input) {
        const raw = String(input || '').trim();
        if (YOUTUBE_ID_RE.test(raw)) return makeYouTube(raw);

        const url = parseUrl(raw);
        if (!url) return null;

        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com';
        if (host === 'youtu.be') {
            const id = cleanPathParts(url)[0];
            return YOUTUBE_ID_RE.test(id || '') ? makeYouTube(id) : null;
        }
        if (!isYouTube) return null;

        const fromQuery = url.searchParams.get('v');
        if (YOUTUBE_ID_RE.test(fromQuery || '')) return makeYouTube(fromQuery);

        const parts = cleanPathParts(url);
        if (['embed', 'live', 'shorts'].includes(parts[0]) && YOUTUBE_ID_RE.test(parts[1] || '')) {
            return makeYouTube(parts[1]);
        }
        return null;
    }

    function parseTwitch(input) {
        const raw = String(input || '').trim();
        const prefixed = raw.match(/^twitch:([A-Za-z0-9_]{3,25})$/);
        if (prefixed) return makeTwitchChannel(prefixed[1]);

        const url = parseUrl(raw);
        if (!url) return null;

        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'twitch.tv' && host !== 'm.twitch.tv') return null;

        const parts = cleanPathParts(url);
        if (parts[0] === 'videos' && TWITCH_VIDEO_RE.test(parts[1] || '')) {
            return makeTwitchVideo(parts[1]);
        }

        const channel = parts[0];
        if (!TWITCH_CHANNEL_RE.test(channel || '')) return null;
        if (TWITCH_RESERVED_PATHS.has(channel.toLowerCase())) return null;
        return makeTwitchChannel(channel);
    }

    function parseRumble(input) {
        const raw = String(input || '').trim();
        const prefixed = raw.match(/^rumble:(v[A-Za-z0-9_-]+)$/i);
        if (prefixed) return makeRumbleEmbed(prefixed[1]);

        const url = parseUrl(raw);
        if (!url) return null;

        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'rumble.com') return null;

        const parts = cleanPathParts(url);
        if (parts[0] === 'embed' && RUMBLE_EMBED_RE.test(parts[1] || '')) {
            return makeRumbleEmbed(parts[1]);
        }
        if (parts.length === 1 && RUMBLE_EMBED_RE.test(parts[0])) {
            return makeRumbleEmbed(parts[0]);
        }
        return null;
    }

    function parseHls(input) {
        const url = parseUrl(input);
        if (!url) return null;
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        if (!url.pathname.toLowerCase().endsWith('.m3u8')) return null;
        return makeHlsPlaylist(url);
    }

    function parseDash(input) {
        const url = parseUrl(input);
        if (!url) return null;
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        if (!url.pathname.toLowerCase().endsWith('.mpd')) return null;
        return makeDashManifest(url);
    }

    function parseStreamUrl(input) {
        return parseYouTube(input) || parseTwitch(input) || parseRumble(input) || parseHls(input) || parseDash(input);
    }

    function normalizeStreamRecord(record, fallbackId) {
        if (!record) return null;

        const rawId = String(record.id || fallbackId || '').trim();
        const detectedType = String(record.type || (
            rawId.startsWith('twitch-') ? 'twitch' :
                rawId.startsWith('rumble-') ? 'rumble' :
                    rawId.startsWith('hls-') ? 'hls' :
                        rawId.startsWith('dash-') ? 'dash' :
                            'youtube'
        )).toLowerCase();
        const type = ['twitch', 'rumble', 'hls', 'dash'].includes(detectedType) ? detectedType : 'youtube';
        const sourceKind = String(record.sourceKind || (
            rawId.startsWith('twitch-vod-') ? 'video' :
                type === 'twitch' ? 'channel' :
                    type === 'rumble' ? 'embed' :
                        type === 'hls' ? 'playlist' :
                            type === 'dash' ? 'manifest' :
                                'video'
        )).toLowerCase();

        let sourceId = String(record.sourceId || record.videoId || record.channel || '').trim();
        if (!sourceId) {
            if (type === 'youtube') {
                sourceId = rawId || String(fallbackId || '').trim();
            } else if (sourceKind === 'video') {
                const video = rawId.replace(/^twitch-vod-/i, '');
                sourceId = TWITCH_VIDEO_RE.test(video) ? 'v' + video.replace(/^v/i, '') : video;
            } else if (type === 'rumble') {
                sourceId = rawId.replace(/^rumble-/i, '');
            } else if (type === 'hls' || type === 'dash') {
                sourceId = record.url || record.src || '';
            } else {
                sourceId = rawId.replace(/^twitch-/i, '');
            }
        }

        if (type === 'youtube' && !YOUTUBE_ID_RE.test(sourceId)) return null;
        if (type === 'twitch' && sourceKind === 'channel' && !TWITCH_CHANNEL_RE.test(sourceId)) return null;
        if (type === 'twitch' && sourceKind === 'video' && !TWITCH_VIDEO_RE.test(sourceId)) return null;
        if (type === 'rumble' && !RUMBLE_EMBED_RE.test(sourceId)) return null;
        if (type === 'hls' && !parseHls(sourceId)) return null;
        if (type === 'dash' && !parseDash(sourceId)) return null;

        const normalizedSourceId = type === 'twitch' && sourceKind === 'channel'
            ? sourceId.toLowerCase()
            : type === 'twitch'
                ? 'v' + sourceId.replace(/^v/i, '')
                : sourceId;
        const id = rawId || (type === 'youtube'
            ? normalizedSourceId
            : sourceKind === 'video'
                ? 'twitch-vod-' + normalizedSourceId.replace(/^v/i, '')
                : type === 'hls'
                    ? stableId('hls', normalizedSourceId)
                    : type === 'dash'
                        ? stableId('dash', normalizedSourceId)
                        : type + '-' + normalizedSourceId);

        return {
            id,
            gunKey: String(fallbackId || id),
            type,
            sourceId: normalizedSourceId,
            sourceKind,
            addedAt: record.addedAt || Date.now(),
            muted: record.muted !== false,
            label: record.label || ''
        };
    }

    function streamToGunRecord(source, now) {
        return {
            id: source.id,
            type: source.type,
            sourceId: source.sourceId,
            sourceKind: source.sourceKind,
            addedAt: now || Date.now(),
            muted: true,
            label: ''
        };
    }

    function getTwitchParent(parent) {
        const explicit = String(parent || '').trim();
        const fromLocation = root.location && root.location.hostname ? root.location.hostname : '';
        const value = explicit || fromLocation || 'localhost';
        return value.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0] || 'localhost';
    }

    function framePolicy(provider) {
        const base = {
            loading: 'lazy',
            referrerPolicy: 'strict-origin-when-cross-origin'
        };

        if (provider === 'youtube') {
            return {
                ...base,
                sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups'
            };
        }
        if (provider === 'twitch-chat') {
            return {
                ...base,
                sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups'
            };
        }
        return {
            ...base,
            sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups'
        };
    }

    function buildEmbed(record, options) {
        const stream = normalizeStreamRecord(record, record && record.id);
        if (!stream) return null;

        if (stream.type === 'youtube') {
            return {
                ...framePolicy('youtube'),
                type: 'youtube',
                title: 'YouTube video ' + stream.sourceId,
                label: stream.label || stream.sourceId,
                videoUrl: 'https://www.youtube.com/embed/' + encodeURIComponent(stream.sourceId) + '?autoplay=1&mute=' + (stream.muted ? '1' : '0'),
                chatUrl: '',
                allow: 'accelerometer;autoplay;clipboard-write;encrypted-media;fullscreen;gyroscope;picture-in-picture'
            };
        }

        if (stream.type === 'rumble') {
            return {
                ...framePolicy('rumble'),
                type: 'rumble',
                title: 'Rumble video ' + stream.sourceId,
                label: stream.label || 'Rumble ' + stream.sourceId,
                videoUrl: 'https://rumble.com/embed/' + encodeURIComponent(stream.sourceId) + '/',
                chatUrl: '',
                allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture'
            };
        }

        if (stream.type === 'hls') {
            return {
                type: 'hls',
                title: 'HLS stream ' + stream.sourceId,
                label: stream.label || 'HLS: ' + stream.sourceId.replace(/^https?:\/\//i, '').split(/[/?#]/)[0],
                videoUrl: '',
                mediaUrl: stream.sourceId,
                chatUrl: '',
                allow: ''
            };
        }

        if (stream.type === 'dash') {
            return {
                type: 'dash',
                title: 'DASH stream ' + stream.sourceId,
                label: stream.label || 'DASH: ' + stream.sourceId.replace(/^https?:\/\//i, '').split(/[/?#]/)[0],
                videoUrl: '',
                mediaUrl: stream.sourceId,
                chatUrl: '',
                allow: ''
            };
        }

        const parent = getTwitchParent(options && options.parent);
        const muted = stream.muted ? 'true' : 'false';
        const params = new URLSearchParams({
            parent,
            autoplay: 'true',
            muted
        });

        if (stream.sourceKind === 'video') {
            params.set('video', stream.sourceId);
            return {
                ...framePolicy('twitch'),
                type: 'twitch',
                title: 'Twitch VOD ' + stream.sourceId.replace(/^v/i, ''),
                label: stream.label || 'Twitch VOD ' + stream.sourceId.replace(/^v/i, ''),
                videoUrl: 'https://player.twitch.tv/?' + params.toString(),
                chatUrl: '',
                allow: 'autoplay; fullscreen; picture-in-picture'
            };
        }

        params.set('channel', stream.sourceId);
        const chatPolicy = framePolicy('twitch-chat');
        return {
            ...framePolicy('twitch'),
            type: 'twitch',
            title: 'Twitch channel ' + stream.sourceId,
            label: stream.label || 'Twitch: ' + stream.sourceId,
            videoUrl: 'https://player.twitch.tv/?' + params.toString(),
            chatUrl: 'https://www.twitch.tv/embed/' + encodeURIComponent(stream.sourceId) + '/chat?parent=' + encodeURIComponent(parent),
            chatTitle: 'Twitch chat ' + stream.sourceId,
            chatSandbox: chatPolicy.sandbox,
            chatReferrerPolicy: chatPolicy.referrerPolicy,
            chatLoading: chatPolicy.loading,
            allow: 'autoplay; fullscreen; picture-in-picture'
        };
    }

    return {
        parseStreamUrl,
        normalizeStreamRecord,
        streamToGunRecord,
        buildEmbed,
        getTwitchParent
    };
});
