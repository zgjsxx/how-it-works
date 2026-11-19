/**
 * 工业园区智慧微电网 · 回归测试
 * 运行：node tests/industrial-park-microgrid.test.js
 * 约定：单文件、无依赖、只用 node 原生模块
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'energy/industrial-park-microgrid/index.html'), 'utf8');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- 分发与结构 ---------- */
assert.match(home, /href="energy\/industrial-park-microgrid\/index\.html"/, '首页应提供工业园区微电网入口');
assert.doesNotMatch(page, /<script[^>]+src=/i, '单文件分发：不能引用外部 script');
assert.doesNotMatch(page, /<link[^>]+href=/i, '不能引用外部样式表');
assert.match(page, /three\.js r160/, 'three.js 必须已内联');

for (const id of ['view', 'chartPower', 'chartForecast', 'chartSoc', 'chartGrid', 'strategy', 'scenarios',
                  'manualPanel', 'btnManual', 'btnTransparent', 'btnExplode', 'btnResetView',
                  'kpiPV', 'kpiLoad', 'kpiBESS', 'kpiGas', 'kpiGrid', 'kpiCrit',
                  'modePill', 'speedSel', 'logList', 'modal', 'selName']) {
  assert.match(page, new RegExp('id="' + id + '"'), '缺少界面元素 #' + id);
}
for (const v of ['eco', 'renewable', 'demand', 'reliability', 'carbon']) {
  assert.match(page, new RegExp('data-s="' + v + '"'), '缺少调度目标：' + v);
}
for (const v of ['sunny', 'cloud', 'surge', 'surplus', 'bessFault', 'outage', 'gasFault', 'peak']) {
  assert.match(page, new RegExp('data-sc="' + v + '"'), '缺少场景：' + v);
}
for (const n of ['并网计量装置', '电池管理系统', '光伏汇流箱', '能源预测', '优化调度', '运行策略', '告警管理']) {
  assert.match(page, new RegExp(n), '设备树应包含：' + n);
}

/* ---------- 一次接线图 ---------- */
for (const id of ['sldPanel', 'sldSvg', 'btnSLD', 'sldClose', 'sldGridP', 'sldPccState', 'sldMode',
                  'sldKva', 'sldPvP', 'sldPcsP', 'sldGas1', 'sldGas2', 'sldBusIn', 'sldBusOut',
                  'sldLoadA', 'sldLoadB', 'sldLoadC', 'sldLoadAir', 'sldLoadChiller', 'sldLoadOffice', 'sldLoadEv',
                  'sldLim1', 'sldLim2', 'sldLim3', 'sldLim4']) {
  assert.match(page, new RegExp('id="' + id + '"'), '一次接线图缺少元素 #' + id);
}
assert.equal((page.match(/<svg/g) || []).length, (page.match(/<\/svg>/g) || []).length, 'SVG 标签必须成对');
assert.match(page, /function updateSLD\(/, '一次接线图应有实时功率刷新逻辑');
assert.match(page, /sldFlow\('lnGrid'/, '电网支路应随购售电方向流动');
assert.match(page, /sldFlow\('lnPv'/, '光伏支路应随功率方向流动');
assert.match(page, /sldFlow\('lnPcs'/, '储能支路应随充放电方向流动');
assert.match(page, /if\s*\(sldOpen\)\s*updateSLD\(snap\)/, '接线图打开时应随仿真步刷新');
assert.match(page, /kvaLoad \/ Math\.max\(1, s\.trafoLimit\)/, '接线图应显示变压器负载率');

const scripts = [...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scripts.length >= 4, '页面应包含 three.js、仿真内核、场景与界面脚本');
for (const code of scripts) {
  if (!code.trim()) continue;
  assert.doesNotThrow(() => new Function(code), '内联脚本必须保持合法 JavaScript');
}

/* ---------- 仿真内核 ---------- */
const core = page.match(/<script id="sim-core">([\s\S]*?)<\/script>/)[1];
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(core, ctx, { filename: 'sim-core.js' });
const S = ctx.SIMCORE;
const C = S.CFG;

assert.equal(C.pvKwp, 5000, '光伏 5 MWp');
assert.equal(C.bessKw, 2000, '储能 2 MW');
assert.equal(C.bessKwh, 4000, '储能 4 MWh');
assert.equal(C.gasUnitKw, 1000, '单台燃气 1 MW');
assert.equal(C.gasUnits, 2, '两台燃气机组');
assert.equal(C.demandKw, 3400, '申报需量 3400 kW');
assert.equal(C.importMax, 4200, '并网购电上限 4200 kW');
assert.equal(S.STRATEGIES.length, 5, '应支持 5 种调度目标');
assert.equal(S.STRATEGIES.map(s => s.id).join(','), 'eco,renewable,demand,reliability,carbon', '目标顺序/命名');
assert.equal(S.TOPO.nodes.filter(n => n.zone === 'load').length, 3, '三个生产车间');
assert.equal(S.TOPO.nodes.filter(n => n.zone === 'aux').length, 4, '辅助负荷包含空压/冷站/办公/充电');

function balance(x) {
  return (x.load - x.shed - x.unserved) + x.pcs - x.pv - x.gas - x.grid;
}

/* 计划 */
{
  const st = S.createSim({ t: 8 * 60, soc: 0.6 });
  assert.ok(st.plan && st.plan.pcs.length === 1440, '应生成 1440 点计划');
  assert.equal(st.plan.gas.length, 1440, '燃气计划 1440 点');
  assert.equal(st.plan.shed.length, 1440, '负荷计划 1440 点');
  assert.ok(st.plan.soc[0] >= C.socMin && st.plan.soc[0] <= C.socMax, '计划 SOC 起点在范围内');
}

/* 五种目标 × 24h 不变式 */
const costs = [];
for (const objective of S.STRATEGIES) {
  const st = S.createSim({ t: 0, soc: 0.55, objective: objective.id });
  let maxDemand = 0;
  for (let i = 0; i < 1440; i++) {
    const x = S.step(st);
    const tag = objective.id + ' @' + x.time;
    assert.ok(Math.abs(balance(x)) < 1e-6, tag + ' 功率平衡');
    assert.ok(x.soc >= C.socMin - 1e-9 && x.soc <= C.socMax + 1e-9, tag + ' SOC 在 10–95%');
    assert.ok(Math.abs(x.pcs) <= C.bessKw + 1e-6, tag + ' PCS 不超额定');
    assert.ok(x.gas >= -1e-9 && x.gas <= C.gasUnitKw * 2 + 1e-6, tag + ' 燃气出力在 0–2000 kW');
    if (x.mode === 'grid') {
      assert.ok(x.grid <= C.importMax + 1, tag + ' 购电不超协议上限');
      assert.ok(x.grid >= -C.exportMax - 1, tag + ' 反送不超上限');
    }
    maxDemand = Math.max(maxDemand, x.demand15);
  }
  costs.push(st.cost.total);
  if (objective.id === 'demand') {
    assert.ok(maxDemand <= C.demandKw * 1.05, '需量策略应把 15min 需量压在 3570 kW 以内，实际 ' + maxDemand.toFixed(0));
  }
}
assert.ok(new Set(costs.map(c => Math.round(c))).size >= 3, '不同策略应产生不同的日运行成本');

/* 离网：停电后孤岛、PCC 断开、燃气/储能支撑、分级切负荷 */
{
  const st = S.createSim({ t: 19 * 60, soc: 0.55 });
  S.applyScenario(st, 'outage');
  let x = S.step(st);
  for (let i = 0; i < 6; i++) x = S.step(st);
  assert.equal(x.mode, 'island', '停电后应进入孤岛');
  assert.equal(x.pcc, false, '孤岛时 PCC 应断开');
  assert.equal(x.grid, 0, '孤岛时电网功率为 0');
  assert.ok(Math.abs(balance(x)) < 1e-6, '孤岛功率平衡');
  assert.ok(x.gas > 0, '孤岛应启动燃气机组');
  assert.ok(x.pcs < 0, '孤岛应由储能放电支撑');
  assert.ok(x.freq >= 48.5 && x.freq <= 50.2, '孤岛频率应在允许范围');
  assert.ok(x.shed >= 0 && x.unserved >= 0, '切负荷/未供电不应为负');
  assert.ok(x.criticalRate >= 99, '一级负荷保障率应接近 100%，实际 ' + x.criticalRate.toFixed(1));

  S.applyScenario(st, 'restore');
  for (let i = 0; i < 5; i++) x = S.step(st);
  assert.equal(x.mode, 'grid', '电网恢复后应回到并网');
  assert.equal(x.pcc, true, '并网后 PCC 合闸');
}

/* 储能故障：PCS 退出 */
{
  const st = S.createSim({ t: 12 * 60, soc: 0.6 });
  S.applyScenario(st, 'bessFault');
  const x = S.step(st);
  assert.equal(x.pcs, 0, 'PCS 故障后功率应为 0');
  assert.equal(x.mods.bessFault, true, '故障标记应保留');
}

/* 燃气故障：单台退出，总出力不超过另一台 */
{
  const st = S.createSim({ t: 19 * 60, soc: 0.6 });
  S.applyScenario(st, 'gasFault');
  let x = S.step(st);
  for (let i = 0; i < 5; i++) x = S.step(st);
  assert.equal(x.gasUnits[0].state, 'fault', '#1 应处于故障');
  assert.equal(x.gasUnits[0].p, 0, '#1 故障出力为 0');
  assert.ok(x.gas <= C.gasUnitKw + 1e-6, '故障后总出力不超过 1000 kW');
}

/* 手动控制经过边界校验 */
{
  const st = S.createSim({ t: 12 * 60, soc: 0.6 });
  S.setManual(st, { pv: 1200, bess: 300, prod: 1500, aux: 700, importKw: 2500 });
  const x = S.step(st);
  assert.ok(Math.abs(x.pv - 1200) < 1, '手动光伏应生效');
  assert.ok(Math.abs(x.pcs - 300) < 1, '手动储能应生效');
  assert.ok(x.grid <= 2500 + 1, '手动购电上限应生效');
  assert.ok(Math.abs(balance(x)) < 1e-6, '手动工况仍满足功率平衡');
  assert.ok(x.loadParts.prodA + x.loadParts.prodB + x.loadParts.prodC <= 1500 + 1, '生产负荷被限制在设定值');
}

/* 场景清除 */
{
  const st = S.createSim({ t: 12 * 60, soc: 0.6 });
  S.applyScenario(st, 'cloud');
  S.applyScenario(st, 'clear');
  const x = S.step(st);
  assert.equal(x.mods.weather, 'clear', '清除场景后应恢复晴天');
}

console.log('industrial-park-microgrid: all checks passed');
