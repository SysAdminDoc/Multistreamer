const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

test('keeps optional Gun relay Docker package documented and locked', () => {
    const relayPackage = JSON.parse(fs.readFileSync(path.join(root, 'relay', 'package.json'), 'utf8'));
    const relayLock = JSON.parse(fs.readFileSync(path.join(root, 'relay', 'package-lock.json'), 'utf8'));
    const server = fs.readFileSync(path.join(root, 'relay', 'server.js'), 'utf8');
    const dockerfile = fs.readFileSync(path.join(root, 'relay', 'Dockerfile'), 'utf8');
    const compose = fs.readFileSync(path.join(root, 'relay', 'docker-compose.yml'), 'utf8');
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

    assert.equal(relayPackage.dependencies.gun, '0.2020.1241');
    assert.equal(relayLock.packages[''].dependencies.gun, '0.2020.1241');
    assert.match(server, /Gun\(\{\s+web: server,/);
    assert.match(server, /gunPath: '\/gun'/);
    assert.match(dockerfile, /RUN npm ci --omit=dev/);
    assert.match(compose, /8765:8765/);
    assert.match(compose, /\/healthz/);
    assert.match(readme, /cd relay/);
    assert.match(readme, /docker compose up -d --build/);
    assert.match(readme, /http:\/\/localhost:8765\/gun/);
});
