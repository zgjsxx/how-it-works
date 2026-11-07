const assert = require('node:assert/strict');
const fs = require('node:fs');

const tutorial = fs.readFileSync('energy/bms-rc-model/index.html', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const scripts = [...tutorial.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((script) => script.trim() && !script.includes('window.MathJax'));

for (const script of scripts) new Function(script);

assert.match(tutorial, /href="\.\.\/\.\.\/"/, '教程页应提供首页返回入口');
assert.match(home, /href="energy\/bms-rc-model\/"/, '首页应提供教程入口');
for (const id of ['i', 'r0', 'r1', 'c1', 'chart', 'pointTable']) {
  assert.match(tutorial, new RegExp(`id="${id}"`), `缺少交互元素：${id}`);
}
assert.match(tutorial, /CELL MODEL/, '应应用统一的能源教学导航样式');

console.log('bms-rc-model: integration checks passed');
