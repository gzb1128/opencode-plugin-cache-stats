# opencode-plugin-cache-stats

一个 opencode TUI sidebar 插件，实时显示 LLM prompt cache 命中率。

## 为什么需要这个插件

LLM provider（如 Anthropic）支持 prompt cache，可以显著降低延迟和成本。但当你引入了自定义的 opencode plugin 或 hook（如 `chat.params`、`chat.headers`、`experimental.chat.messages.transform` 等）时，可能会在每次请求中修改 system prompt、消息内容或请求参数，导致 prompt cache **每次都 miss**。

这个插件让你一眼就能看到缓存命中率是否正常：

- **命中率持续很低**（红色/黄色）→ 很可能是某个 plugin/hook 每次都在改请求内容，导致缓存失效
- **命中率正常**（绿色）→ plugin/hook 没有影响缓存行为

### 常见导致缓存失效的原因

- hook 在 `chat.params` 中动态注入了随时间变化的参数
- hook 在 `chat.headers` 中每次请求使用不同的值
- hook 在 `experimental.chat.messages.transform` 中修改了消息内容
- plugin 在 `experimental.chat.system.transform` 中每次注入不同的 system prompt

### 数据来源

数据来自 LLM API 返回的 usage 统计，不是 opencode 计算的：

- `tokens.input` — 非缓存 input token 数
- `tokens.cache.read` — 从 prompt cache 命中的 token 数
- `tokens.cache.write` — 写入缓存的 token 数（冷启动）
- `tokens.output` — output token 数

## 安装

### 方式一：本地文件引用

1. 将 `src/index.tsx` 复制到 opencode 插件目录：

```bash
cp src/index.tsx ~/.config/opencode/plugins/cache-stats.tsx
```

2. 创建或编辑 `~/.config/opencode/tui.json`（全局）或项目下 `.opencode/tui.json`：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "file:///Users/<you>/.config/opencode/plugins/cache-stats.tsx"
  ]
}
```

也可以使用相对路径（相对于 `tui.json` 所在目录）：

```json
{
  "plugin": [
    "./plugins/cache-stats.tsx"
  ]
}
```

3. 重启 opencode，sidebar 中即出现 Cache Hit Rate 面板。

### 方式二：npm 安装（发布后可用）

```bash
npm install opencode-plugin-cache-stats
```

在 `tui.json` 中添加：

```json
{
  "plugin": [
    "opencode-plugin-cache-stats"
  ]
}
```

## 功能

在 sidebar 中显示最后一条 assistant 消息的缓存命中率：

```
Cache Hit Rate
92.3%
604.7K cached / 656M
```

- **命中率公式**：`cache_read / (cache_read + input_tokens)`
- **颜色编码**：
  - ≥ 80%：绿色（success）
  - 50% ~ 80%：黄色（warning）
  - < 50%：红色（error）
- **空状态**：无 assistant 消息时显示 `--`
