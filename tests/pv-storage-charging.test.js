const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'energy/pv-storage-charging/index.html'), 'utf8');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- 分发与结构 ---------- */
assert.match(home, /href="energy\/pv-storage-charging\/index\.html"/, '首页应提供光储充场站入口');
assert.doesNotMatch(page, /<script[^>]+src=/i, '单文件分发：不能引用外部 script');
assert.doesNotMatch(page, /<link[^>]+href=/i, '不能引用外部样式表');
assert.match(page, /three\.js r160/, 'three.js 必须已内联');
for (const id of ['view', 'chartPv', 'chartBess', 'chartSoc', 'chartGrid', 'chartBal', 'logList', 'modal', 'selcard']) {
  assert.match(page, new RegExp('id="' + id + '"'), '缺少界面元素 #' + id);
}
for (const s of ['pv', 'bess', 'tou', 'anti', 'manual']) {
  assert.match(page, new RegExp('data-s="' + s + '"'), '缺少 EMS 策略按钮：' + s);
}
for (const s of ['night', 'cloud', 'pvdrop', 'surge', 'lowsoc', 'gridlimit', 'outage']) {
  assert.match(page, new RegExp('data-sc="' + s + '"'), '缺少场景按钮：' + s);
}

const scripts = [...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scripts.length >= 3, '页面应包含 three.js、仿真内核、3D 与界面脚本');
for (const code of scripts) {
  if (!code.trim()) continue;
  assert.doesNotThrow(() => new Function(code), '内联脚本必须保持合法 JavaScript');
}

/* ---------- 仿真内核：真实计算 ---------- */
const coreMatch = page.match(/<script id="sim-core">([\s\S]*?)<\/script>/);
assert.ok(coreMatch, '应存在独立的仿真内核 <script id="sim-core">');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(coreMatch[1], ctx, { filename: 'sim-core.js' });
const S = ctx.SIMCORE;
const CFG = S.CFG;

assert.equal(CFG.pvKwp, 1000, '光伏装机应为 1 MWp');
assert.equal(CFG.bessKw, 500, '储能 PCS 应为 500 kW');
assert.equal(CFG.bessKwh, 1000, '储能容量应为 1 MWh');
assert.equal(CFG.chargers, 10, '充电桩应为 10 台');
assert.equal(CFG.chargerKw, 120, '单桩功率应为 120 kW');

/* 拓扑：变压器只与 0.4kV 母线和 10kV 开关柜相连，不能串在光伏/储能/充电之间 */
const topo = S.TOPO;
const byId = Object.fromEntries(topo.edges.map(e => [e.id, e]));
assert.equal(byId.e_tr.from, 'bus');
assert.equal(byId.e_tr.to, 'tr');
assert.equal(byId.e_hv.from, 'tr');
assert.equal(byId.e_hv.to, 'sw10');
assert.equal(byId.e_grid.from, 'sw10');
assert.equal(byId.e_grid.to, 'grid');
assert.equal(byId.e_pv_ac.to, 'bus');
assert.equal(byId.e_pcs.to, 'bus');
assert.equal(byId.e_chg.from, 'bus');
assert.equal(topo.edges.filter(e => e.to.startsWith('ev')).length, 10, '应有 10 条充电馈线');

/* 08:00 光伏优先：富余充电，功率平衡 */
let st = S.createSim();
let s = st.snap;
assert.ok(Math.abs(s.pv - 451) < 30, '08:00 光伏出力应在 450 kW 左右');
assert.ok(s.pcs > 0, '08:00 光伏富余应给电池充电');
assert.ok(Math.abs(s.load + s.pcs - s.pv - s.grid) < 0.01, '功率平衡必须闭合');

/* 连续 4 小时：PCS 不超额定，SOC 在 10%–95%，SOC 与功率自洽 */
st = S.createSim();
st.t = 10 * 60;
for (let i = 0; i < 240; i++) {
  const x = S.stepSim(st);
  assert.ok(Math.abs(x.pcs) <= CFG.bessKw + 1e-6, 'PCS 功率不得超过 500 kW');
  assert.ok(x.soc >= 0 && x.soc <= 1, 'SOC 必须被约束在 0–1');
}
assert.ok(st.soc >= CFG.socMin - 1e-9 && st.soc <= CFG.socMax + 1e-9, 'SOC 必须落在 10%–95% 运行区间');

/* 防逆流 + 满电：必须弃光，不能倒送 */
st = S.createSim(); st.strategy = 'anti'; st.t = 12 * 60; st.soc = 0.95;
s = S.stepSim(st);
assert.ok(s.grid > -0.5, '防逆流模式不得向电网倒送');
assert.ok(s.curtailed > 100, '满电时应限制光伏出力');
assert.ok(s.flags.includes('pv-curtail'), '应记录弃光标记');

/* 电网断电：进线功率为 0，不足部分限负荷 */
st = S.createSim(); st.t = 19 * 60;
S.stepSim(st);
S.applyScenario(st, 'outage');
s = st.snap;
assert.ok(Math.abs(s.grid) < 0.5, '断电时电网功率应为 0');
assert.ok(s.shed > 0, '断电且储能不足时应限负荷');
assert.ok(s.flags.includes('load-shed'), '应记录限负荷标记');

/* 峰谷电价：谷段从电网充电 */
st = S.createSim(); st.strategy = 'tou'; st.t = 2 * 60; st.soc = 0.4;
s = S.stepSim(st);
assert.ok(s.pcs > 400, '谷段应满功率充电');
assert.ok(s.grid > 400, '谷段充电功率应来自电网');

/* 手动模式：PCS 指令生效并受 SOC 约束 */
st = S.createSim(); st.strategy = 'manual'; st.t = 12 * 60;
st.manual = { pcs: 300, pv: 800, load: 400 };
s = S.stepSim(st);
assert.ok(Math.abs(s.pcs - 300) < 0.01, '手动 PCS 功率应被采用');
assert.ok(Math.abs(s.grid - (400 + 300 - 800)) < 0.01, '手动模式电网功率应按平衡计算');

/* 决策日志：有可解释字段 */
st = S.createSim();
for (let i = 0; i < 30; i++) S.stepSim(st);
assert.ok(st.log.length > 0, '应产生 EMS 决策日志');
assert.ok(typeof st.log[0].note === 'string' && st.log[0].note.length > 5, '日志应包含决策说明');
assert.ok(st.log[0].snap.battery && st.log[0].snap.battery.maxCharge >= 0, '日志应记录电池约束');

/* 仿真时间推进 */
st = S.createSim();
const t0 = st.t;
S.stepSim(st);
assert.equal(st.t, (t0 + 1) % 1440, '每步推进 1 分钟');

console.log('pv-storage-charging: all checks passed');
