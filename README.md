# borehole-app

钻孔柱状图桌面应用 · React + Tauri 2 真实代码版（取代 `../borehole-log-pro/borehole-log-pro.html` 单文件原型）。

## 状态

✅ 阶段 A · 前端架子 · 已完成
✅ 阶段 B · 业务完整移植 · 已完成（派生引擎 / LITHO 库 / BoreholeChart / DataEditor / 持久化 / 导出 / 打印）
✅ 阶段 C · Tauri 桌面壳 · 已初始化 + `cargo check` 通过（4 min · stable-x86_64-apple-darwin）

下一步：`npm run tauri:dev` 启动原生窗口，或 `npm run tauri:build` 出 .dmg / .msi / .nsis 安装包。
（首次 `tauri:build` 会再花约 10 分钟编译 release 版 + 打包。）

## 技术栈

| 层 | 选型 |
|---|---|
| 构建 | Vite 5 + React-SWC |
| UI | React 19 + TS 6 + Ant Design 6 (zhCN locale) |
| 状态 | Zustand 5（取代原型 `let STATE`） |
| 测试 | Vitest 1 + jsdom + Testing Library |
| 桌面壳 | Tauri 2.11 + Rust 1.95 |

## 目录

```
borehole-app/
├── index.html
├── package.json
├── vite.config.ts                    # Vite + Vitest 配置合一
├── tsconfig*.json
├── public/
├── src/
│   ├── main.tsx + App.tsx
│   ├── print.css                     # @media print 样式
│   ├── types.ts                      # 10 个 interface（数据模型）
│   ├── store/
│   │   └── borehole.ts               # Zustand store
│   ├── lib/
│   │   ├── derive.ts (+ .test.ts)    # 派生引擎（runs/layers/samples/wellBore）18 case
│   │   ├── litho.ts (+ .test.ts)     # 岩性查询 + 别名 + 分组 18 case
│   │   ├── litho-db.ts               # 429 + 11 条岩性数据
│   │   ├── litho-patterns.raw.svg    # 32 个 SVG patterns
│   │   ├── chart-layout.ts (+ .test.ts)  # 24 列布局几何 7 case
│   │   ├── templates.ts              # 岩性描述模板
│   │   ├── add-row.ts (+ .test.ts)   # 新增行智能默认值 5 case
│   │   ├── persistence.ts (+ .test.ts)   # 保存/打开/导出 3 case
│   │   ├── empty-data.ts             # 空骨架数据
│   │   └── sample-data.ts            # ZK1042 示例
│   ├── components/
│   │   ├── common/LithoPatterns.tsx  # 全局 SVG patterns 注册
│   │   ├── BoreholeChart/
│   │   │   ├── BoreholeChart.tsx (+ .test.tsx)  # 主图 7 case
│   │   │   ├── helpers.tsx           # cellNum/cellTxt/verticalLabel/wrapText
│   │   │   ├── WellBoreColumn.tsx    # 钻孔结构子组件
│   │   │   └── FooterTables.tsx      # 底部 3 附表
│   │   └── DataEditor/
│   │       ├── DataEditor.tsx (+ .test.tsx)  # 5 Tab Modal 4 case
│   │       ├── MetaTab.tsx
│   │       ├── RunsTab.tsx
│   │       ├── LayersTab.tsx
│   │       ├── LithoSelect.tsx       # 岩性下拉（429 选项 + 分组 + 搜索）
│   │       ├── SamplesTab.tsx
│   │       └── ExtrasTab.tsx         # 钻孔结构 + 弯曲度 + 丈量
│   └── __tests__/
│       ├── setup.ts                  # ResizeObserver / matchMedia polyfill
│       ├── store.test.ts             # 2 case
│       └── app.test.tsx              # 集成 4 case
└── src-tauri/                        # Tauri 2 桌面壳
    ├── Cargo.toml
    ├── tauri.conf.json               # 窗口/标识/bundle 配置
    ├── icons/
    ├── capabilities/
    └── src/                          # Rust 入口（占位，仅注册 plugin）
```

测试统计：**68 测试 · 全过**

## 开发命令

```bash
# 浏览器开发（不需要 Rust）
npm install
npm run dev               # → http://localhost:5173

# 跑测试
npm test
npm run test:watch

# 生产构建
npm run build

# Tauri 桌面（需要 Rust 工具链）
npm run tauri:dev         # 启动 dev server + 原生窗口（首次编译 5-10 min）
npm run tauri:build       # 出 .dmg / .msi / .nsis 安装包
```

## 跟原型的对照

| 功能 | borehole-log-pro.html (原型) | borehole-app (新代码) |
|---|---|---|
| 24 列 SVG 柱状图 | renderColumnSVG (DOM string) | BoreholeChart (React JSX) |
| 数据模型 | `let STATE` | Zustand store + TS types |
| 派生引擎 | deriveAfterEdit (mutate) | derive.ts (pure functions) |
| 岩性库 | LITHO_DB + Proxy | litho.ts + 直查 |
| 编辑器 | renderDataEditor (innerHTML) | DataEditor (React Modal + 5 Tab) |
| 持久化 | 没有 | save/open .json |
| 导出 SVG | downloadSVG | exportSVG（含 patterns 内联）|
| 打印 | window.print + CSS | 同 + React 模式下 .no-print 隔离 |
| 入口数 | 1 个 HTML 文件 | 1 个 npm 项目 |

## 未做

- Tauri fs API 接入（持久化目前走浏览器 download，Tauri 阶段切原生 save dialog 体验更好）
- 多孔列表 / 数据底座 (JOURNEY.md F1)
- 自定义岩性花纹 (cl/ 下解压的 2421 个 .pat 文件)
- 代码签名（macOS Apple Dev / Windows Code Signing）→ 测试版未签名分发
- 自动更新

## 已知问题

- `npm install` 后偶现 rolldown 二进制 binding 缺失 → 已显式装 `@rolldown/binding-darwin-x64`（npm optional dep 已知 bug）
- jsdom 缺 `ResizeObserver` / `matchMedia` → `__tests__/setup.ts` 已 polyfill
- Vite 5 / Vitest 1（不是最新）→ 因为 Node 20 不支持 Vitest 4 用的 `styleText` array 语法
