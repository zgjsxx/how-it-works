const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'energy', '2gwh-bess-station', 'index.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(page, /500MW\s*\/\s*2000MWh/);
assert.match(page, /5MW\s*\/\s*20MWh/);
assert.match(page, /25MW\s*\/\s*100MWh/);
assert.match(page, /全部 20 回集电线路/);
assert.match(page, /35\/220kV/);
assert.match(page, /220kV\s*AIS 配电装置/);
assert.match(page, /电池 DC → PCS 0\.8kV AC → 箱变 35kV/);
assert.match(page, /400 台/);
assert.match(page, /5 个储能单元 → 接入井/);
assert.match(page, /pointerdown/);
assert.match(page, /RoundedBoxGeometry/);
assert.match(page, /id="topview"/);
assert.match(page, /id="firstPerson"/);
assert.match(page, /id="trenches"/);
assert.match(page, /id="feeder"/);
assert.match(home, /href="energy\/2gwh-bess-station\/index\.html"/);

assert.match(page, /three@0\.171\.0/);
assert.match(page, /applyQuality/);
assert.match(page, /getElementById\("time"\)\.onchange/);

console.log('2GWh BESS station page checks passed.');
