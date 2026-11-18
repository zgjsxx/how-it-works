const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'energy', '500mwp-pv-station', 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(page, /500MWp 光伏电站/);
assert.match(page, /800,000/);
assert.match(page, /32,000/);
assert.match(page, /16,000/);
assert.match(page, /20 回/);
assert.match(page, /220kV/);
assert.match(page, /OrbitControls/);
assert.match(page, /InstancedMesh/);
assert.match(page, /id="walk"/);
assert.match(page, /id="unitView"/);
assert.match(page, /id="subView"/);
assert.match(page, /three@0\.171\.0/);
assert.match(home, /href="energy\/500mwp-pv-station\/index\.html"/);

console.log('500MWp PV station page checks passed.');
