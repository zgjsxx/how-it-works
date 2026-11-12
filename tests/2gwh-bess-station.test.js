const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'energy', '2gwh-bess-station', 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(page, /500MW\s*\/\s*2000MWh/);
assert.match(page, /5MW\s*\/\s*20MWh/);
assert.match(page, /25MW\s*\/\s*100MWh/);
assert.match(page, /20\s*回\s*35kV/);
assert.match(page, /35\/220kV/);
assert.match(page, /220kV\s*(?:GIS|并网)/);
assert.match(page, /for\(let i=1;i<=20;i\+\+\)/);
assert.match(page, /pointerdown/);
assert.match(page, /wheel/);
assert.match(page, /data-view="overview"/);
assert.match(page, /data-view="feeder"/);
assert.match(page, /data-view="grid"/);
assert.match(home, /href="energy\/2gwh-bess-station\/index\.html"/);

const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(scripts.length, 2, 'expected interaction and WebGL scene scripts');
scripts.forEach(script => new Function(script));
assert.match(page, /three@0\.160\.0/);
assert.match(page, /100 个储能单元\s*\/\s*400 个电池集装箱/);
assert.match(page, /for\(let feeder=0;feeder<20;feeder\+\+\)/);
assert.match(page, /for\(let n=0;n<5;n\+\+\)/);

console.log('2GWh BESS station page checks passed.');
