# how-it-works

> 把值得理解的系统，一层层拆开给你看。
> Interactive explanations for things worth understanding.

每个条目都是一个可以拖、可以点、可以自己动手试的交互页面。不看示意图，看它到底怎么运作。

---

## 目录

### Energy

| 条目 | 说明 | 关键数字 |
|---|---|---|
| [5MWh 储能集装箱](energy/5mwh-bess/) | 20 尺液冷大储的四层结构，可拖拽旋转并逐层下钻到单体电芯 | 4 992 电芯 · 416S12P · 5.016 MWh |
| [2GWh 储能电站](energy/2gwh-bess-station/) | 站级三维场景：电池舱、PCS、35kV 集电线路到 220kV 并网点 | 500 MW / 2 GWh · 20 回集电 |
| [BMS 一阶 RC 模型](energy/bms-rc-model/) | 从端电压曲线推导 R₀、R₁、C₁ 的作用与离散递推 | 1RC · 8 节 · 可调曲线 |
| [磷酸铁锂电芯原理](energy/lifepo4-cell-principles/) | 充放电、析锂、自放电与内短路的机理与判读边界 | 3 场景 · 5 专题 |
| [电励磁同步发电机](energy/synchronous-generator/) | 可拖拽剖切模型 + 相量图 + 并网合闸：旋转磁场、电枢反应、有功无功 | 100 MW · 3 000 r/min · 4 并网条件 |

### AI

_筹备中。_

---

## 本地运行

没有构建步骤，也没有依赖安装。整个仓库是静态文件。

```bash
# 方式一：直接双击任意 index.html

# 方式二：起个静态服务器（推荐，避免个别浏览器的 file:// 限制）
python -m http.server 8000
# 打开 http://localhost:8000
```

**每个条目都是完全自包含的单文件**：three.js 已经内联在 HTML 里，没有任何外部请求。所以既能整站部署，也能把单个 `index.html` 直接发给别人——对方双击就能看，不需要附带任何其他文件。

> `assets/three.min.js` 仍然保留，作为升级与重新内联的源文件。改版 three.js 后需重新内联，测试会检查这一点。

---

## 仓库结构

```
how-it-works/
├── index.html              # 首页索引
├── assets/
│   └── three.min.js        # 3D 库源文件（条目内已内联，此处留存备升级）
├── energy/
│   └── 5mwh-bess/
│       └── index.html      # 每个条目自包含单文件
├── ai/                     # 以后的 AI 主题
├── tests/                  # 结构回归测试（node 原生 assert，无需依赖）
└── README.md
```

**约定：**

1. 每个条目放在 `<领域>/<slug>/index.html`
2. **必须是自包含单文件**——所有 JS/CSS 内联，不引用同目录或其他目录的文件。这是硬性要求，因为条目要能被单独分发
3. 新增条目时只在首页加一张卡片，不改动已有代码

## 测试

```bash
node tests/5mwh-bess.test.js
node tests/synchronous-generator.test.js
```

这些测试守着几件容易被改坏的事：页面必须无外部 script 引用（保证单文件可分发性）、three.js 已内联、拖拽旋转的方向与角度钳制、模组必须是 104 只电芯、点击必须能命中电芯网格。

---

## 许可证

代码以 [MIT](LICENSE) 发布。

页面里的文字、图表与 3D 模型为原创，欢迎转载与引用，请注明来源；如需商用请先联系。