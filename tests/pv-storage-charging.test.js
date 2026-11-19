/**
 * 光储充场站 · 计划 / 跟踪 / 约束 回归测试
 * 运行：node tests/pv-storage-charging.test.js
 * 约定：单文件、无依赖、只用 node 原生模块
 */
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

for (const id of ['view', 'chartPlan', 'chartSoc', 'chartMargin', 'objSel', 'limReverse', 'limKva', 'limDemand',
                  'cmdPlan', 'cmdCut', 'cmdActual', 'cmdWhy', 'trkMae', 'trkSoc', 'logList', 'modal']) {
  assert.match(page, new RegExp('id="' + id + '"'), '缺少界面元素 #' + id);
}
for (const v of ['tou', 'peakShaving', 'demandMin', 'selfConsume', 'manual']) {
  assert.match(page, new RegExp('<option value="' + v + '"'), '目标下拉缺少：' + v);
}
/* 旧的一排策略按钮不应再出现 */
assert.doesNotMatch(page, /data-s="anti"/, '互斥策略按钮应已被 目标 + 约束 取代');

const scripts = [...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scripts.length >= 3, '页面应包含 three.js、仿真内核与界面脚本');
for (const code of scripts) {
  if (!code.trim()) continue;
  assert.doesNotThrow(() => new Function(code), '内联脚本必须保持合法 JavaScript');
}

/* ---------- 一次接线图 ---------- */
for (const id of ['sldPanel', 'sldSvg', 'btnSLD', 'sldClose', 'sldGridP', 'sldGridState',
                  'sldKva', 'sldKvaPct', 'sldPvP', 'sldPvDc', 'sldPcsP', 'sldSoc',
                  'sldLoadP', 'sldBusSrc', 'sldBusLoad', 'sldLim1', 'sldLim2', 'sldLim3']) {
  assert.match(page, new RegExp('id="' + id + '"'), '一次接线图缺少元素 #' + id);
}
for (let i = 1; i <= 10; i++) {
  assert.match(page, new RegExp('id="sldEv' + i + '"'), '一次接线图缺少充电桩分支 #' + i);
}
assert.equal((page.match(/<svg/g) || []).length, (page.match(/<\/svg>/g) || []).length, 'SVG 标签必须成对');
assert.match(page, /function updateSLD\(/, '一次接线图应有实时功率刷新逻辑');
assert.match(page, /sldFlow\('lnPv'/, '光伏支路应随功率方向流动');
assert.match(page, /sldFlow\('lnGrid'/, '电网支路应随购售电方向流动');
assert.match(page, /sldFlow\('lnPcs'/, '储能支路应随充放电方向流动');
assert.match(page, /if\s*\(sldOpen\)\s*updateSLD\(snap\)/, '接线图打开时应随仿真步刷新');
assert.match(page, /kvaLoad \/ CFG\.kva/, '接线图应显示变压器负载率');

/* ---------- 仿真内核 ---------- */
const core = page.match(/<script id="sim-core">([\s\S]*?)<\/script>/)[1];
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(core, ctx, { filename: 'sim-core.js' });
const S = ctx.SIMCORE;
const C = S.CFG;

assert.equal(C.pvKwp, 1000, '光伏装机 1 MWp');
assert.equal(C.bessKw, 500, 'PCS 500 kW');
assert.equal(C.bessKwh, 1000, '电池 1 MWh');
assert.equal(C.chargers, 10, '10 台充电桩');
assert.equal(C.chargerKw, 120, '单桩 120 kW');
assert.equal(C.kva, 1250, '配变 1250 kVA');
assert.equal(C.demandKw, 900, '申报需量 900 kW');
assert.equal(S.TARIFF.feedIn, 0.35, '上网电价应为固定 0.35 元/kWh');

/* ---------- 计划 ---------- */
{
  const st = S.createSim({ t: 0, soc: 0.55 });
  assert.ok(st.plan && st.plan.pcs.length === 1440, '应生成 1440 点计划');
  assert.equal(st.plan.from, 0, '计划应覆盖全天');
  const p0 = st.plan.soc[0], pEnd = st.plan.soc[1439];
  assert.ok(Math.abs(pEnd - p0) < 0.02, '计划首尾 SOC 应闭环（' + p0.toFixed(3) + ' → ' + pEnd.toFixed(3) + '）');
}

/* ---------- 不变式：目标 × 约束 × 场景 ---------- */
const SCEN = [null, 'cloud', 'pvdrop', 'surge', 'outage', 'gridlimit'];
for (const objective of S.OBJECTIVES) {
  for (const reverseKw of [0, null]) {
    for (const scen of SCEN) {
      const st = S.createSim({ t: 6 * 60, soc: 0.6, objective, reverseKw });
      if (scen) S.applyScenario(st, scen);
      for (let i = 0; i < 300; i++) {
        const x = S.stepSim(st);
        const tag = objective + '/' + (reverseKw === 0 ? '防逆流' : '允许上网') + '/' + (scen || '晴');
        assert.ok(Math.abs((x.load + x.pcs - x.pv) - x.grid) < 1e-6, tag + ' 功率平衡 @' + x.time);
        assert.ok(Math.abs(x.pcs) <= C.bessKw + 1e-6, tag + ' PCS 不超额定 @' + x.time);
        assert.ok(x.soc >= C.socMin - 1e-9 && x.soc <= C.socMax + 1e-9, tag + ' SOC 在 10–95% @' + x.time);
        assert.ok(x.kvaLoad <= C.kva + 1, tag + ' 配变不超容 @' + x.time);
        assert.ok(x.demand15 <= C.demandKw + 1, tag + ' 15min 需量不超 @' + x.time);
        if (reverseKw === 0) assert.ok(x.grid >= -0.5, tag + ' 不得反送 @' + x.time + ' grid=' + x.grid.toFixed(1));
      }
    }
  }
}

/* ---------- 防逆流开关：一天的上网电量 ---------- */
{
  const runDay = function(reverseKw) {
    const st = S.createSim({ t: 0, soc: 0.55, objective: 'selfConsume', reverseKw });
    for (let i = 0; i < 1440; i++) S.stepSim(st);
    return S.metricsOf(st);
  };
  const noExport = runDay(0);
  const canExport = runDay(null);
  assert.ok(noExport.eOut < 1, '防逆流开启时不应有上网电量（实际 ' + noExport.eOut.toFixed(1) + ' kWh）');
  assert.ok(canExport.eOut > 100, '允许上网时应产生上网电量（实际 ' + canExport.eOut.toFixed(1) + ' kWh）');
  assert.ok(noExport.eCurt > canExport.eCurt, '防逆流时应以弃光换收益');
}

/* ---------- 旧 bug 回归：放电同时倒送 ---------- */
for (const objective of ['tou', 'peakShaving', 'demandMin', 'selfConsume']) {
  for (const reverseKw of [0, null]) {
    const st = S.createSim({ t: 10 * 60, soc: 0.6, objective, reverseKw });
    for (let i = 0; i < 120; i++) {
      const x = S.stepSim(st);
      assert.ok(!(x.pcs < -1 && x.grid < -1),
        objective + '/' + (reverseKw === 0 ? '防逆流' : '允许上网') + ' 峰段出现"边放电边倒送" @' + x.time);
    }
  }
}

/* ---------- 电网断电：进线为 0，不足部分限负荷 ---------- */
{
  const st = S.createSim({ t: 19 * 60, soc: 0.55, objective: 'tou' });
  S.applyScenario(st, 'outage');
  const x = S.stepSim(st);
  assert.ok(Math.abs(x.grid) < 0.5, '断电时电网功率应为 0（实际 ' + x.grid.toFixed(1) + '）');
  assert.ok(x.shed > 0, '断电且储能不足时应限负荷');
  assert.ok(x.reasons.some(r => r.code === 'import'), '断电应记录购电封锁原因');
}

/* ---------- 跟踪与重计划 ---------- */
{
  const st = S.createSim({ t: 8 * 60, soc: 0.55, objective: 'tou' });
  for (let i = 0; i < 120; i++) S.stepSim(st);
  assert.ok(st.replans >= 1, '应发生滚动重计划');
  assert.ok(st.trackN >= 120, '每个仿真步都应记录跟踪误差');
  const m = S.metricsOf(st);
  assert.ok(m.trackMae >= 0 && m.trackMae < 500, '跟踪误差应在合理范围（实际 ' + m.trackMae.toFixed(1) + ' kW）');
}

/* ---------- 手动模式 ---------- */
{
  const st = S.createSim({ t: 12 * 60, soc: 0.6, objective: 'manual' });
  st.manual = { pcs: 200, pv: 600, load: 400 };
  const x = S.stepSim(st);
  assert.ok(Math.abs(x.pcs - 200) < 0.01, '手动 PCS 指令应被执行');
  assert.ok(Math.abs(x.grid - (400 + 200 - 600)) < 0.01, '手动模式仍应满足功率平衡');
}

/* ---------- 昼夜光照：早上日出、中午最亮、晚上天黑 ---------- */
{
  const noon = S.timeOfDay(12 * 60);
  const night = S.timeOfDay(0);
  const dawn = S.timeOfDay(6 * 60);
  const dusk = S.timeOfDay(18 * 60);
  const dusk2 = S.timeOfDay(18 * 60 + 30);

  assert.ok(noon.day > 0.95, '正午应为全白天（day=' + noon.day.toFixed(2) + '）');
  assert.ok(noon.sunI > 3, '正午太阳光应最强');
  assert.ok(!noon.lampOn, '正午不应开灯');
  assert.ok(night.lampOn, '夜间应开灯');
  assert.ok(night.sunI < 1.2, '夜间太阳光应接近熄灭');
  assert.ok(night.exposure < noon.exposure, '夜间整体应更暗');
  assert.ok(night.sky !== noon.sky, '天空颜色应随昼夜变化');

  /* 早上 8 点就该亮起来，不能等到正午才达标 */
  const morning = S.timeOfDay(8 * 60);
  assert.ok(morning.sunI > noon.sunI * 0.8, '8:00 应接近满亮度（' + morning.sunI.toFixed(2) + ' vs ' + noon.sunI.toFixed(2) + '）');
  assert.ok(morning.exposure > noon.exposure * 0.9, '8:00 曝光应接近正午');
  const evening = S.timeOfDay(17 * 60);
  assert.ok(evening.sunI > noon.sunI * 0.4, '17:00 仍应有较强光照（' + evening.sunI.toFixed(2) + '）');

  assert.ok(dawn.dusk > 0.9 && dusk.dusk > 0.9, '日出/日落应有暖色窗口');
  assert.ok(dawn.lampOn && dusk2.lampOn, '日出前 / 日落后应开灯');
  const warm = c => (((c >> 16) & 255) - (c & 255)) > 60;
  assert.ok(warm(dawn.sunColor), '日出时阳光应偏暖');
  assert.ok(warm(dusk.sunColor), '日落时阳光应偏暖');
  assert.ok(warm(0xffb277) && !warm(0xfff2dc), '暖色判定自检');

  assert.ok(dawn.sunX > 20, '6 点太阳应在东侧（+x）');
  assert.ok(dusk.sunX < -20, '18 点太阳应在西侧（−x）');
  assert.ok(Math.abs(noon.sunX) < 10, '正午太阳应接近正上方');
  assert.ok(noon.sunY > dawn.sunY, '正午太阳高度应更高');

  const cloudyNoon = S.timeOfDay(12 * 60, 0.6);
  assert.ok(cloudyNoon.sunI < noon.sunI * 0.8, '阴天光照应明显弱于晴天');
  assert.ok(cloudyNoon.sky !== noon.sky, '阴天天空应转灰');
}

console.log('pv-storage-charging: all checks passed');
