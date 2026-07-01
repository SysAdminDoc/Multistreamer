'use strict';

const http = require('node:http');
const Gun = require('gun');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 8765);
const file = process.env.GUN_FILE || 'data';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
}

const server = http.createServer();

server.on('request', (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    if (url.pathname === '/' || url.pathname === '/healthz') {
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({
            ok: true,
            app: 'multistreamer-gun-relay',
            gunPath: '/gun'
        }));
    }
});

Gun({
    web: server,
    file,
    radisk: true
});

server.listen(port, host, () => {
    console.log(`MultiStream Gun relay listening on http://${host}:${port}/gun`);
});
