const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('energy/lifepo4-cell-principles/index.html', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const scripts = [...page.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(match => match[1]);

for (const script of scripts) new Function(script);

assert.match(page, /href="\.\.\/\.\.\/index\.html"/, '教程页应提供首页返回入口');
assert.match(home, /href="energy\/lifepo4-cell-principles\/index\.html"/, '首页应提供本地文件模式可用的 LFP 教程入口');
assert.match(page, /id="btn-charge"/, '教程应提供充电场景');
assert.match(page, /id="btn-discharge"/, '教程应提供放电场景');
assert.match(page, /id="btn-plate"/, '教程应提供析锂场景');
assert.match(page, /二阶 RC 模型/, '教程应说明与 RC 模型的关系');

console.log('lifepo4-cell-principles: integration checks passed');
