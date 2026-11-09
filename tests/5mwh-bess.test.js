const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'energy/5mwh-bess/index.html'), 'utf8');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

assert.match(home, /href="energy\/5mwh-bess\/index\.html"/, '首页储能教程入口应兼容本地文件模式');

assert.doesNotMatch(
  page,
  /<script[^>]+src=/,
  '页面必须是自包含单文件：不能有外部 script 引用（否则单独拷贝给别人会白屏）'
);
assert.match(
  page,
  /three\.js r160/,
  'three.js 必须已内联进页面'
);
assert.ok(
  fs.existsSync(path.join(ROOT, 'assets/three.min.js')),
  'assets/three.min.js 必须保留（便于升级与再内联）'
);

// 页面现在有两个 script 块（内联的 three.js + 主逻辑），取最后一块来校验语法
const scriptBlocks = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scriptBlocks.length >= 2, '页面应同时包含内联 three.js 与主逻辑两个 script 块');
const inlineScript = scriptBlocks[scriptBlocks.length - 1];

assert.doesNotThrow(
  () => new Function(inlineScript),
  'the browser script must remain valid JavaScript'
);
assert.doesNotThrow(
  () => new Function(scriptBlocks[0]),
  '内联的 third-party 库也必须是合法 JavaScript'
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
