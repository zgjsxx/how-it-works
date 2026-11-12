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
assert.match(page, /4×5MWh 电池舱 \+ 1×PCS\/升压一体机/);
assert.match(page, /400 台/);
assert.match(page, /100 个 5MW\/20MWh 单元/);
assert.match(page, /20 回 35kV 地下集电回路/);
assert.match(page, /pointerdown/);
assert.match(page, /OrbitControls/);
assert.match(page, /RoundedBoxGeometry/);
assert.match(page, /id="topview"/);
assert.match(page, /id="walk"/);
assert.match(page, /id="trenches"/);
assert.match(page, /id="feeder"/);
assert.match(home, /href="energy\/2gwh-bess-station\/index\.html"/);

assert.match(page, /three@0\.171\.0/);
assert.match(page, /getInstanced/);
assert.match(page, /applyQuality/);
assert.match(page, /getElementById\("time"\)\.onchange/);

console.log('2GWh BESS station page checks passed.');
