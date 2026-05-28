# opencode-plugin-cache-stats

一个 opencode TUI sidebar 插件，在 session sidebar 中显示缓存命中率指标。

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
