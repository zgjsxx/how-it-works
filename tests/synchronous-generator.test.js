const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'energy/synchronous-generator/index.html'), 'utf8');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* 首页入口与本地文件模式兼容 */
assert.match(home, /href="energy\/synchronous-generator\/index\.html"/, '首页应提供同步发电机教程入口');
assert.match(page, /href="\.\.\/\.\.\/index\.html"/, '教程页应提供首页返回入口');

/* 单文件分发：不能有外部脚本、样式或字体请求 */
assert.doesNotMatch(page, /<script[^>]+src=/i, '页面必须是自包含单文件：不能引用外部 script');
assert.doesNotMatch(page, /<link[^>]+href=/i, '页面不能引用外部样式表');
assert.doesNotMatch(page, /@import\s+url/i, '页面不能通过 @import 引入外部资源');
assert.match(page, /three\.js r160/, 'three\.js 必须已内联进页面');
assert.ok(fs.existsSync(path.join(ROOT, 'assets/three.min.js')), 'assets/three.min.js 必须保留');

/* 脚本语法 */
const scripts = [...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scripts.length >= 3, '页面应包含内联 three.js、3D 逻辑与交互逻辑');
for (const s of scripts) {
  if (!s.trim()) continue;
  assert.doesNotThrow(() => new Function(s), '页面内联脚本必须保持合法 JavaScript');
}

/* 三个 3D 舞台 */
for (const id of ['heroCanvas', 'mainCanvas', 'demoCanvas']) {
  assert.match(page, new RegExp('id="' + id + '"'), '缺少 3D 画布 #' + id);
}
assert.match(page, /buildMachine\(\{ simple:false \}\)/, '主舞台应可构建完整机组模型');
assert.match(page, /buildPole\(1\); buildPole\(-1\);/, '转子应为 2 极（N/S 各一）');
assert.match(page, /SLOTS:36/, '定子应为 36 槽示意模型');
assert.match(page, /phaseMats/, '三相绕组应有独立材质以便高亮');

/* 结构章节的部件与交互 */
for (const part of ['core', 'winding', 'pole', 'field', 'rings', 'avr', 'prime']) {
  assert.match(page, new RegExp("'" + part + "'"), '缺少部件资料：' + part);
}
assert.match(page, /function setCut\(/, '应提供剖切 / 整机视图切换');
assert.match(page, /raycaster\.intersectObject\(rig\.group, true\)/, '点击 3D 部件应能命中网格');
assert.match(page, /function showPart\(/, '点击部件应更新右侧资料卡');

/* 原理：三相波形与旋转磁场 */
assert.match(page, /e<sub>U<\/sub> \+ e<sub>V<\/sub> \+ e<sub>W<\/sub> = 0/, '应说明三相对称关系');
assert.match(page, /n<sub>1<\/sub> = 60 f \/ p/, '应给出同步转速公式');
assert.match(page, /4\.44/, '应给出 E₀ = 4.44 f N Φ kdp');
assert.match(page, /id="waveCanvas"/, '应有三相电动势波形画布');
assert.match(page, /drawWave\(\)/, '波形应随转子角度重绘');

/* 电枢反应与相量 */
assert.match(page, /id="phasorSvg"/, '应有相量图');
assert.match(page, /id="pdeltaSvg"/, '应有功角特性曲线');
assert.match(page, /电枢反应/, '应讲解电枢反应');
assert.match(page, /j<i>X<\/i><sub>s<\/sub><i>İ<\/i>/, '应给出 E₀ = V + jXsI 电势方程');
assert.match(page, /静稳极限/, '应说明 δ = 90° 静稳极限');

/* 并网与调节 */
assert.match(page, /id="btnBreaker"/, '应提供合闸交互');
assert.match(page, /id="syncDial"/, '应有同期表');
assert.match(page, /准同期/, '应区分准同期与自同期');
assert.match(page, /id="vcurveSvg"/, '应有 V 形曲线');
assert.match(page, /id="opP"/, '并网后应可调节有功');
assert.match(page, /id="opIf"/, '并网后应可调节励磁');
assert.match(page, /有功看汽门，无功看励磁/, '应点明并网后的调节规律');

/* 运行边界与小结 */
assert.match(page, /id="pqSvg"/, '应有 P–Q 能力曲线');
assert.match(page, /失磁保护/, '应介绍失磁与保护');
assert.match(page, /data-answer="b"/, '应有知识自测题');
assert.match(page, /prefers-reduced-motion/, '应尊重减少动画偏好');

console.log('synchronous-generator: all checks passed');
