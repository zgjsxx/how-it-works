const assert = require('node:assert/strict');
const fs = require('node:fs');

const tutorial = fs.readFileSync('energy/bms-rc-model/index.html', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const scripts = [...tutorial.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((script) => script.trim() && !script.includes('window.MathJax'));

for (const script of scripts) new Function(script);

assert.match(tutorial, /href="\.\.\/\.\.\/"/, '教程页应提供首页返回入口');
assert.match(home, /href="energy\/bms-rc-model\/index\.html"/, '首页应提供可在本地文件模式打开的教程入口');
for (const id of ['i', 'r0', 'r1', 'c1', 'chart', 'pointTable']) {
  assert.match(tutorial, new RegExp(`id="${id}"`), `缺少交互元素：${id}`);
}
assert.match(tutorial, /CELL MODEL/, '应应用统一的能源教学导航样式');
assert.match(tutorial, /function formalizeTutorial\(\)/, '应提供统一的技术教学文案');
assert.match(tutorial, /模型构成、电压极性与变量定义/, '应使用正式的模型章节标题');
assert.match(tutorial, /放电电流 I 取正值/, '等效电路应明确放电电流方向');
assert.match(tutorial, /二阶 Thevenin 模型/, '教程应简要说明二阶模型的扩展方式');
assert.doesNotMatch(tutorial, /<section id="s2">/, '不应保留与主题无关的 RC 低通对比节');

console.log('bms-rc-model: integration checks passed');
