const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'energy', '500mw-wind-farm', 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(page, /500MW 陆上风电场/);
assert.match(page, /80 × 6\.25MW/);
assert.match(page, /20 回/);
assert.match(page, /35kV/);
assert.match(page, /220kV/);
assert.match(page, /OrbitControls/);
assert.match(page, /for\(let i=0;i<80;i\+\+\)/);
assert.match(page, /id="turbineView"/);
assert.match(page, /id="subView"/);
assert.match(page, /id="walk"/);
assert.match(home, /href="energy\/500mw-wind-farm\/index\.html"/);
console.log('500MW wind farm page checks passed.');
