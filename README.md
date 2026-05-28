# opencode-plugin-cache-stats

一个 opencode TUI sidebar 插件，在 session sidebar 中显示缓存命中率指标。

## 安装

```bash
npm install opencode-plugin-cache-stats
```

## 集成到 opencode

在 `tui.json` 中注册本插件：

```json
{
  "plugins": [
    "opencode-plugin-cache-stats"
  ]
}
```

### 其他安装方式

1. **本地开发调试**：将编译产物放入 `.opencode/plugin/cache-stats.js`（opencode 会自动发现）
2. **文件引用**：在 `tui.json` 中添加 `"file://./path/to/plugin"`

## 功能

在 sidebar 中显示最后一条 assistant 消息的缓存命中率：

```
Cache Hit Rate
92.3%
604.7K cached / 656M
```

- **命中率公式**：`cache_read / (cache_read + input_tokens)`
- **颜色编码**：
  - ≥ 80%：绿色
  - 50% ~ 80%：黄色
  - < 50%：红色
