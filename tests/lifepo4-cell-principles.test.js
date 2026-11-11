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
assert.match(page, /内短路的形成机理、风险与监测边界/, '教程应介绍内短路的机理与判读边界');
assert.match(page, /任一单项信号均不足以确证内短路/, '教程不应将单一信号误作内短路确证');
assert.match(page, /id="btn-short"/, '交互剖面应提供内短路动画场景');
assert.match(page, /internal-short-animation/, '内短路场景应包含局部异常导通动画');
assert.match(page, /静置自放电的机理与异常识别/, '教程应包含自放电教学章节');
assert.match(page, /id="sd-normal"/, '自放电章节应支持正常自放电场景');
assert.match(page, /id="sd-short"/, '自放电章节应支持微内短路场景');
assert.match(page, /静置自放电速率对比/, '自放电章节应对比正常与异常自放电速率');
assert.match(page, /sd-abnormal-soc/, '自放电章节应显示异常自放电的示意 SOC');
assert.match(page, /电芯异常问题专题/, '析锂、自放电和内短路应归入统一的问题专题');
assert.match(page, /02\.3 · 内短路的形成机理、风险与监测边界/, '内短路应作为问题专题的子章节');
assert.match(page, /id="issue-plate"/, '问题专题应提供析锂动画');
assert.match(page, /id="issue-short"/, '问题专题应提供内短路动画');
assert.match(page, /部分未正常嵌入石墨/, '析锂动画应显示锂离子迁移与未嵌入石墨的分支');

console.log('lifepo4-cell-principles: integration checks passed');
