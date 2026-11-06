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

### AI

_筹备中。_

---

## 本地运行

没有构建步骤，也没有依赖安装。整个仓库是静态文件。

```bash
# 方式一：直接双击 index.html

# 方式二：起个静态服务器（推荐，避免个别浏览器的 file:// 限制）
python -m http.server 8000
# 打开 http://localhost:8000
```

3D 部分依赖 `assets/three.min.js`（r160，已随仓库提供），**离线可用**。

---

## 仓库结构

```
how-it-works/
├── index.html              # 首页索引
├── assets/
│   └── three.min.js        # 共享的 3D 库（离线）
├── energy/
│   └── 5mwh-bess/
│       └── index.html      # 每个条目自包含
├── ai/                     # 以后的 AI 主题
├── tests/                  # 结构回归测试（node 原生 assert，无需依赖）
└── README.md
```

**约定：** 每个条目放在 `<领域>/<slug>/index.html`，自包含，只共享 `assets/` 里的库。新增条目时只在首页加一张卡片，不改动已有代码。

## 测试

```bash
node tests/5mwh-bess.test.js
```

这些测试守着几件容易被改坏的事：three.js 引用路径、拖拽旋转的方向与角度钳制、模组必须是 104 只电芯、点击必须能命中电芯网格。

---

## 许可证

代码以 [MIT](LICENSE) 发布。

页面里的文字、图表与 3D 模型为原创，欢迎转载与引用，请注明来源；如需商用请先联系。