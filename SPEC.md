# opencode-plugin-cache-stats

## 概述

一个 opencode TUI sidebar 插件，在 session sidebar 中显示缓存命中率指标，帮助用户了解模型 prompt cache 的工作效率。

## 决策记录

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 方案 | 独立 npm 包（Approach A） | 不侵入 opencode 源码，可分发，符合独立项目定位 |
| 命中率公式 | `cache_read / (cache_read + input)` | 衡量总 input 中有多少被缓存命中，直观反映效率 |
| 显示范围 | 仅最后一条 assistant 消息 | 与现有 Context 插件保持一致，轻量实时 |
| slot 位置 | `sidebar_content`，order=150 | 插在 Context(100) 和 MCP(200) 之间 |

## 命中率公式

```
hit_rate = cache_read / (cache_read + input_tokens)
```

- `cache_read`：从 prompt cache 命中读取的 input tokens
- `input_tokens`：未被缓存命中的 input tokens（即 `tokens.input` 字段）
- 分母 = 总 input tokens，分子 = 被缓存服务的部分
- 返回值：0% ~ 100%，越高越好

注意：不关心 `cache_write`（缓存冷启动建缓存），只关心命中率反映的工作效率。

## 技术规格

### 项目结构

```
opencode-plugin-cache-stats/
├── package.json
├── tsconfig.json
└── src/
    └── index.tsx
```

### package.json 关键字段

```json
{
  "name": "opencode-plugin-cache-stats",
  "exports": {
    "./tui": "./src/index.tsx"
  }
}
```

### 插件接口

```typescript
import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { AssistantMessage } from "@opencode-ai/sdk/v2"
```

- 导出 `{ id: "cache-stats", tui }`
- 使用 `api.slots.register()` 注册到 `sidebar_content`

### 数据来源

通过 `api.state.session.messages(session_id)` 获取消息列表，找到最后一条 `role === "assistant" && tokens.output > 0` 的消息，读取：

- `message.tokens.cache.read` — 缓存命中的 token 数
- `message.tokens.input` — 非缓存 input token 数

使用 SolidJS 的 `createMemo` 做响应式计算。

### UI 布局

```
┌──────────────────────┐
│ Cache Hit Rate       │
│ 92.3%                │
│ 604.7K cached / 656M │
└──────────────────────┘
```

- 标题行：`Cache Hit Rate`（粗体）
- 主指标：命中率百分比，带颜色编码：
  - >= 80%：绿色（`theme().success`）
  - 50%~80%：黄色（`theme().warning`）
  - < 50%：红色（`theme().error`）
- 辅助行：`cached / total` 的绝对数值，方便对照
- 无 assistant 消息时：显示 `--` 占位

### 颜色方案

使用 `api.theme.current` 中的语义化颜色：
- `theme().success` — 高命中率
- `theme().warning` — 中命中率
- `theme().error` — 低命中率
- `theme().textMuted` — 辅助文本

### 注册代码模式

```tsx
const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 150,
    slots: {
      sidebar_content(_ctx, props) {
        return <CacheStatsView api={api} session_id={props.session_id} />
      },
    },
  })
}

export default { id: "cache-stats", tui }
```

## 安装方式

用户可选择以下任一方式：

1. **npm 安装**：在 `tui.json` 中添加 `"opencode-plugin-cache-stats"`
2. **本地文件**：将编译产物放入 `.opencode/plugin/cache-stats.js`（自动发现）
3. **文件引用**：在 `tui.json` 中添加 `"file://./path/to/plugin"`

## 依赖

- `@opencode-ai/plugin`：提供 `TuiPlugin`, `TuiPluginApi` 类型
- `@opencode-ai/sdk`：提供 `AssistantMessage` 类型
- `solid-js`：`createMemo`（opencode runtime 内置，无需打包）

## 不做什么

- 不显示 cache_write 相关信息
- 不做跨 session 的历史统计（那是 `opencode stats` 的职责）
- 不做累计平均（仅最后一条消息）
- 不显示 cost 相关数据（Context 插件已有）
