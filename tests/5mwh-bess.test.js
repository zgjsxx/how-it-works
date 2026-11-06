const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'energy/5mwh-bess/index.html'), 'utf8');

assert.match(
  page,
  /<script src="\.\.\/\.\.\/assets\/three\.min\.js"><\/script>/,
  '页面必须从仓库共享的 assets 目录加载 three.js'
);
assert.ok(
  fs.existsSync(path.join(ROOT, 'assets/three.min.js')),
  'assets/three.min.js 必须存在（离线可用）'
);

const inlineScript = page.match(/<script>\s*([\s\S]*)<\/script>\s*<\/body>/)[1];

assert.doesNotThrow(
  () => new Function(inlineScript),
  'the browser script must remain valid JavaScript'
);

assert.match(
  page,
  /var orbitYaw=0, orbitPitch=0;/,
  'main stage needs persistent yaw/pitch state for drag rotation'
);
assert.match(
  page,
  /dragging=true;\s*auto=false;/,
  'pointer movement must enter drag mode and pause the auto turntable'
);
assert.match(
  page,
  /orbitYaw -= dx\*0\.006;/,
  'horizontal drag must rotate in the same direction as the pointer'
);
assert.match(
  page,
  /orbitPitch=Math\.max\(-0\.42,Math\.min\(0\.42,orbitPitch-dy\*0\.004\)\);/,
  'vertical drag must change the orbit pitch within safe viewing bounds'
);
assert.doesNotMatch(
  page,
  /drawPackCount\(/,
  'the Pack view should not add a dedicated cell-count banner'
);
assert.match(page, /var CELL_W=74, CELL_D=170, CELL_H=200, GPX=7, GPZ=6, GCC=13;/);
assert.match(page, /for\(var i=0;i<104;i\+\+\)/, 'the 3D Pack must contain exactly 104 cells');
assert.match(page, /c\.userData\.cellIndex=i;/, 'each cell body must be selectable');
assert.match(page, /intersectObjects\(L2\.children, true\)/, 'Pack clicks must raycast against cell meshes');

console.log('5mwh-bess: all regression checks passed');