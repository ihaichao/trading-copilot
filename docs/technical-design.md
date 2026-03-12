# 技术方案：交易辅助系统

---

## 一、整体架构

TypeScript 全栈 monorepo，前后端统一语言，VPS 部署。

```
浏览器 ← Nginx ← Next.js（前端，SSR/CSR）
                ← NestJS（API 服务）← Yahoo Finance API
                    ├── strategy 模块（策略计算）
                    └── PostgreSQL（持久化）
```

---

## 二、技术栈

### 2.1 核心技术栈

| 层       | 选型                            | 说明                                           |
| -------- | ------------------------------- | ---------------------------------------------- |
| 语言     | TypeScript                      | 前后端统一，类型共享                           |
| 前端框架 | Next.js                         | SSR/CSR 灵活，React 生态                       |
| 后端框架 | NestJS                          | 模块化架构，依赖注入，适合中等复杂度后端       |
| 金融图表 | TradingView Lightweight Charts  | 专为金融场景设计，K 线交互体验远优于通用图表库 |
| 样式     | Tailwind CSS                    | 原子化 CSS，深色主题开箱即用                   |
| 数据源   | Yahoo Finance（yahoo-finance2） | 免费，无需 API Key，日线数据                   |
| 数据库   | PostgreSQL                      | 自选股等用户数据持久化                         |
| ORM      | Prisma                          | 类型安全，迁移管理方便，与 NestJS 集成成熟     |

### 2.2 工程化工具

| 用途          | 工具                    | 说明                                   |
| ------------- | ----------------------- | -------------------------------------- |
| Monorepo 管理 | Turborepo               | 任务编排、构建缓存、并行执行           |
| 包管理        | pnpm                    | workspace 原生支持，安装快、磁盘占用小 |
| 代码规范      | ESLint + Prettier       | ESLint 检查逻辑问题，Prettier 统一格式 |
| Git 钩子      | husky + lint-staged     | 提交前自动 lint/format，只检查变动文件 |
| 提交规范      | commitlint              | 强制 Conventional Commits 格式         |
| 测试          | Vitest                  | 快速，与 TypeScript 生态一致           |
| 容器化        | Docker + Docker Compose | 应用 + 数据库容器化，Nginx 宿主机直装  |
| CI/CD         | GitHub Actions          | 自动 lint → test → build → deploy      |

---

## 三、项目结构

```
trading-copilot/
├── apps/
│   ├── web/                          # Next.js 前端
│   │   ├── src/
│   │   │   ├── app/                  # App Router 页面
│   │   │   ├── components/           # UI 组件
│   │   │   │   ├── chart/            # K 线图表组件
│   │   │   │   ├── scanner/          # 信号扫描面板
│   │   │   │   ├── summary/          # 信号摘要卡片
│   │   │   │   └── rules/            # 策略规则面板
│   │   │   ├── hooks/                # 自定义 React Hooks
│   │   │   ├── lib/                  # 工具函数
│   │   │   └── styles/               # 全局样式
│   │   ├── tailwind.config.ts
│   │   └── next.config.ts
│   │
│   └── server/                       # NestJS 后端
│       ├── prisma/
│       │   ├── schema.prisma         # 数据库 Schema
│       │   └── migrations/           # 迁移文件
│       └── src/
│           ├── prisma/               # Prisma Service
│           │   └── prisma.service.ts
│           ├── modules/
│           │   ├── market-data/      # 数据获取模块
│           │   │   ├── market-data.service.ts
│           │   │   ├── market-data.controller.ts
│           │   │   └── market-data.module.ts
│           │   ├── strategy/         # 策略计算模块
│           │   │   ├── strategy.service.ts
│           │   │   ├── strategy.controller.ts
│           │   │   ├── strategy.module.ts
│           │   │   └── indicators/   # 技术指标计算
│           │   │       ├── ema.ts
│           │   │       ├── rsi.ts
│           │   │       ├── stoch-rsi.ts
│           │   │       └── swing-points.ts
│           │   └── watchlist/        # 自选股管理模块
│           │       ├── watchlist.service.ts
│           │       ├── watchlist.controller.ts
│           │       └── watchlist.module.ts
│           ├── app.module.ts
│           └── main.ts
│
├── packages/
│   └── shared/                       # 共享类型与常量
│       └── src/
│           ├── types/                # 类型定义
│           │   ├── signal.ts         # SignalInfo 等核心类型
│           │   ├── market-data.ts    # OHLCV 数据类型
│           │   └── trend.ts          # 趋势分类类型
│           └── constants/            # 策略参数常量
│               └── config.ts
│
├── docker/
│   ├── Dockerfile.web
│   └── Dockerfile.server
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── .eslintrc.js
├── .prettierrc
├── commitlint.config.js
└── docs/
    ├── 01-trading-strategy.md
    ├── 02-product-plan.md
    └── 03-technical-design.md
```

### 设计原则

- **策略层与展示层分离**：策略计算在 `server/strategy` 模块，返回结构化数据；前端只负责渲染和交互
- **配置外置**：所有策略参数集中在 `packages/shared/constants/config.ts`，前后端共用
- **类型共享**：核心数据结构定义在 `packages/shared/types/`，前后端引用同一份类型
- **纯函数风格**：策略指标计算函数无副作用，输入 OHLCV 数组 → 输出计算结果

---

## 四、核心数据结构

定义在 `packages/shared/src/types/` 中，前后端共用。

### 4.1 OHLCV 数据

```typescript
interface OhlcvBar {
  date: string; // ISO 8601 日期
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### 4.2 信号信息

```typescript
type TrendType = 'bullish' | 'mild_bullish' | 'ranging' | 'mild_bearish' | 'bearish';

type SignalType =
  | 'pullback_long' // 突破回踩做多
  | 'bounce_short' // 跌破反弹做空
  | 'oversold' // 超卖
  | 'overbought' // 超买
  | 'breakout_up' // 向上突破
  | 'breakout_down'; // 向下跌破

interface Signal {
  type: SignalType;
  label: string; // 中文展示名
}

interface SignalInfo {
  // 基础数据
  close: number;
  trend: TrendType;
  rsi: number;
  stochRsi: number;
  ema21: number;
  ema50: number;
  ema100: number;
  ema200: number;

  // 信号
  signals: Signal[];
  score: number; // 0-100

  // 关键价位
  resistance: number | null;
  support: number | null;
  stopLong: number;
  stopShort: number;

  // 入场三要素
  checkStructure: boolean;
  checkSignal: boolean;
  checkStoploss: boolean;
  allChecksPassed: boolean;

  // 赔率参考
  riskDistance: number; // 当前价到止损位的百分比
  rewardDistance: number | null; // 当前价到目标位的百分比
  riskRewardRatio: number | null; // 盈亏比
}
```

### 4.3 策略参数配置

```typescript
// packages/shared/src/constants/config.ts

export const STRATEGY_CONFIG = {
  ema: {
    periods: [21, 50, 100, 200] as const,
  },
  rsi: {
    period: 14,
    oversold: 35,
    overbought: 70,
  },
  stochRsi: {
    period: 14,
    oversold: 20,
    overbought: 80,
  },
  breakout: {
    lookback: 20,
    volumeRatio: 1.2,
  },
  pullback: {
    tolerance: 0.01,
    expiryDays: 10,
  },
  stop: {
    buffer: 0.01,
  },
  swingPoint: {
    lookback: 5,
    structureWindow: 60,
  },
  score: {
    base: 50,
    trend: 20,
    rsiOversold: 15,
    rsiOverbought: -10,
    pullbackLong: 20,
    bounceShort: -20,
    volumeConfirm: 10,
    perfectEmaAlignment: 5,
  },
} as const;
```

---

## 五、数据库设计

使用 PostgreSQL 持久化用户数据，Prisma 作为 ORM。

### 5.1 Schema

```prisma
// apps/server/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model WatchlistItem {
  id        Int      @id @default(autoincrement())
  ticker    String   @unique
  name      String?                    // 标的名称（如 "Apple Inc."）
  sortOrder Int      @default(0)       // 自定义排序
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("watchlist_items")
}
```

### 5.2 初始数据

通过 Prisma Seed 插入默认自选股：

```typescript
// apps/server/prisma/seed.ts

const defaultWatchlist = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust' },
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
];
```

---

## 六、API 设计

### 6.1 接口列表

| 方法   | 路径                    | 说明           | 返回                                     |
| ------ | ----------------------- | -------------- | ---------------------------------------- |
| GET    | `/api/scan`             | 批量扫描自选股 | `ScanResult[]`                           |
| GET    | `/api/analysis/:ticker` | 单标的完整分析 | `{ bars: OhlcvBar[], info: SignalInfo }` |
| GET    | `/api/watchlist`        | 获取自选股列表 | `WatchlistItem[]`                        |
| POST   | `/api/watchlist`        | 添加自选股     | `WatchlistItem`                          |
| PATCH  | `/api/watchlist/:id`    | 更新排序       | `WatchlistItem`                          |
| DELETE | `/api/watchlist/:id`    | 删除自选股     | `void`                                   |

### 6.2 扫描结果

```typescript
interface ScanResult {
  ticker: string;
  close: number;
  changePercent: number;
  trend: TrendType;
  signals: Signal[];
  score: number;
  rsi: number;
}
```

### 6.3 查询参数

| 参数       | 适用接口                             | 说明     | 默认值 |
| ---------- | ------------------------------------ | -------- | ------ |
| `period`   | `/api/scan`, `/api/analysis/:ticker` | 数据周期 | `1y`   |
| `interval` | `/api/analysis/:ticker`              | K 线间隔 | `1d`   |

---

## 七、策略引擎

### 7.1 计算流水线

```
原始 OHLCV[] → computeEmas()       → 带 EMA 的数据
             → detectSwingPoints()  → 带 SwingHigh/SwingLow 标记
             → computeRsi()         → RSI 值
             → computeStochRsi()    → StochRSI 值
             → detectBreakouts()    → 突破/跌破信号
             → detectPullbacks()    → 回踩/反弹信号
             → classifyTrend()      → 趋势分类
             → computeScore()       → 综合评分
             → checkEntryConditions() → 入场三要素
```

统一入口：

```typescript
// apps/server/src/modules/strategy/strategy.service.ts

function runFullAnalysis(bars: OhlcvBar[]): {
  enrichedBars: EnrichedBar[];
  info: SignalInfo;
};
```

### 7.2 关键算法

**EMA 计算**：

```typescript
function computeEma(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}
```

**RSI 计算（EMA 法，与 TradingView 一致）**：

```typescript
function computeRsi(closes: number[], period: number): number[] {
  const deltas = closes.map((c, i) => (i === 0 ? 0 : c - closes[i - 1]));
  const gains = deltas.map((d) => Math.max(d, 0));
  const losses = deltas.map((d) => Math.abs(Math.min(d, 0)));
  const avgGain = computeEma(gains, period);
  const avgLoss = computeEma(losses, period);
  return avgGain.map((g, i) => {
    if (avgLoss[i] === 0) return 100;
    const rs = g / avgLoss[i];
    return 100 - 100 / (1 + rs);
  });
}
```

**Swing Point 检测**：

```typescript
function detectSwingPoints(bars: OhlcvBar[], lookback: number): SwingPoint[] {
  // 第 i 根 K 线是 swing high 的条件：
  // 其 high 是前后各 lookback 根 K 线中的最高值
  // swing low 同理取 low 最低值
}
```

---

## 八、前端组件

### 8.1 页面布局

```
┌──────────────────────────────────────────────────────┐
│  顶栏: 标题 + 核心口号                                  │
├──────────────────────────────────────────────────────┤
│  操作栏: [输入框] [添加] [扫描全部] [周期选择]            │
├──────────────┬───────────────────────────────────────┤
│  信号扫描面板  │  信号摘要卡片 + 三要素检查 + 赔率参考      │
│  (左侧 420px) ├───────────────────────────────────────┤
│              │  K 线图 + EMA + 信号标记                 │
│  ─────────── │  RSI 子图                               │
│  策略规则面板  │  成交量子图                              │
│  (常驻)      │                                        │
├──────────────┴───────────────────────────────────────┤
```

### 8.2 组件划分

| 组件                 | 职责                                                            |
| -------------------- | --------------------------------------------------------------- |
| `<Scanner />`        | 信号扫描面板，展示自选股列表和信号状态                          |
| `<Chart />`          | 封装 TradingView Lightweight Charts，渲染 K 线 + EMA + 信号标记 |
| `<RsiChart />`       | RSI 副图                                                        |
| `<VolumeChart />`    | 成交量副图                                                      |
| `<SignalSummary />`  | 信号摘要卡片，含三要素指示灯和赔率参考                          |
| `<StrategyRules />`  | 策略规则面板（静态内容）                                        |
| `<WatchlistInput />` | 自选股添加/删除操作栏                                           |

### 8.3 状态管理

使用 React 内置状态管理，无需引入外部状态库：

| 状态         | 管理方式               | 说明               |
| ------------ | ---------------------- | ------------------ |
| 自选股列表   | `useState` + API 同步  | 增删时调用后端接口 |
| 扫描结果     | `useSWR` 或 `useQuery` | 自动缓存和重新验证 |
| 当前选中标的 | `useState`             | 本地状态           |
| 图表周期     | `useState`             | 本地状态           |

### 8.4 UI 风格

深色主题（TradingView / GitHub Dark 风格）：

| 元素      | 色值      |
| --------- | --------- |
| 背景色    | `#0d1117` |
| 卡片背景  | `#161b22` |
| 边框      | `#30363d` |
| 正文文字  | `#c9d1d9` |
| 强调色    | `#58a6ff` |
| 涨 / 做多 | `#3fb950` |
| 跌 / 做空 | `#f85149` |

---

## 九、数据流

### 9.1 批量扫描

```
用户点击"扫描全部"
  → 前端 GET /api/scan?period=1y
  → NestJS 遍历 watchlist
    → 逐个调用 yahoo-finance2 获取 OHLCV
    → 策略引擎 runFullAnalysis()
    → 提取 ScanResult 字段
  → 按 score 降序返回
  → 前端渲染 Scanner 面板
```

### 9.2 单标的分析

```
用户点击某标的
  → 前端 GET /api/analysis/:ticker?period=1y
  → NestJS 获取 OHLCV + runFullAnalysis()
  → 返回 { bars, info }
  → 前端渲染 Chart + SignalSummary
```

### 9.3 数据刷新策略

| 版本 | 策略                                                 |
| ---- | ---------------------------------------------------- |
| MVP  | 手动刷新，点击"扫描全部"重新拉取数据                 |
| V2   | 开盘时间段自动轮询（每 5 分钟），支持 WebSocket 推送 |

---

## 十、部署

### 10.1 架构

```
VPS (Ubuntu)
├── Nginx（宿主机直装，反向代理 + HTTPS）
└── Docker
    ├── Container: web（Next.js，端口 3000）
    ├── Container: server（NestJS，端口 3001）
    └── Container: postgres（PostgreSQL，端口 5432）
```

### 10.2 Nginx 配置

宿主机通过 apt 安装 Nginx，配置反向代理：

| 路径     | 转发目标                |
| -------- | ----------------------- |
| `/api/*` | `http://127.0.0.1:3001` |
| `/*`     | `http://127.0.0.1:3000` |

HTTPS 通过 Certbot (Let's Encrypt) 管理证书。

### 10.3 Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '127.0.0.1:5432:5432'
    environment:
      - POSTGRES_USER=trading
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=trading_copilot
    volumes:
      - postgres_data:/var/lib/postgresql/data

  server:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    ports:
      - '127.0.0.1:3001:3001'
    environment:
      - DATABASE_URL=postgresql://trading:${POSTGRES_PASSWORD}@postgres:5432/trading_copilot
    depends_on:
      - postgres

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - '127.0.0.1:3000:3000'
    environment:
      - API_URL=http://server:3001

volumes:
  postgres_data:
```

### 10.4 CI/CD 流程

```
git push → GitHub Actions
  → pnpm install
  → turbo run lint test build
  → docker build & push
  → SSH 到 VPS 执行 docker compose pull && docker compose up -d
```

---

## 十一、关键技术决策

| 决策             | 选择                           | 理由                                      |
| ---------------- | ------------------------------ | ----------------------------------------- |
| EMA21 而非 EMA20 | EMA21                          | 机构偏好，约 3% 价差优势                  |
| RSI 计算方式     | EMA 法                         | 与 TradingView 默认一致，便于交叉验证     |
| 突破判定基准     | 收盘价                         | 过滤盘中假突破                            |
| 放量阈值         | 1.2 倍 20 日均量               | 经验值，需实盘验证                        |
| 图表库           | TradingView Lightweight Charts | 专为金融图表设计，K 线交互体验优于 Plotly |
| 全栈语言         | TypeScript                     | 前后端类型共享，统一工具链                |

---

## 十二、已知局限与改进方向

| 局限                | 影响                       | 改进方向                         |
| ------------------- | -------------------------- | -------------------------------- |
| 仅日线数据          | 无法做多周期联动           | V2 增加 4H / 周线分析            |
| 数据延迟 15-20 分钟 | 不适合日内交易             | 换实时数据源（Alpaca / Polygon） |
| 超买超卖为近似实现  | 信号精度有限               | 持续迭代指标逻辑，回测验证       |
| 无事件日历          | 财报等事件可能导致信号失效 | V2 接入事件日历，添加风险提示    |
| 评分权重为初始值    | 评分准确度待验证           | 积累数据后回测调参               |
| 无通知推送          | 需主动打开仪表盘           | V2 接入 Telegram Bot / 邮件通知  |

---

## 十三、测试策略

### 单元测试

策略计算模块（`apps/server/src/modules/strategy/indicators/`）：

- EMA 计算正确性（与已知值比对）
- RSI 输出范围 [0, 100]
- 趋势分类覆盖全部 5 种状态
- 各信号触发条件按预期工作
- 评分输出范围 [0, 100]
- 空数组输入不崩溃

### 集成测试

API 端到端（`apps/server/`）：

- `/api/scan` 返回格式正确
- `/api/analysis/:ticker` 返回完整数据
- `/api/watchlist` CRUD 操作正常
- 数据源异常时优雅降级

### 手工验证

以 TradingView 为参照：

- 对比同一标的同一时间段的 EMA 值
- 对比 RSI 值
- 验证信号触发时点的合理性
