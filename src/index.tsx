import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { AssistantMessage } from "@opencode-ai/sdk/v2"
import { createMemo } from "solid-js"

/**
 * 将数字格式化为人类可读的字符串（K/M/G）
 */
function formatNumber(num: number): string {
  if (num === 0) return "0"
  const abs = Math.abs(num)
  if (abs < 1000) return num.toString()

  let value: number
  let unit: string

  if (abs < 1_000_000) {
    value = abs / 1000
    unit = "K"
  } else if (abs < 1_000_000_000) {
    value = abs / 1_000_000
    unit = "M"
  } else {
    value = abs / 1_000_000_000
    unit = "G"
  }

  // 处理四舍五入导致的进位（如 999.95K 应显示为 1.0M）
  if (value >= 999.95) {
    if (unit === "K") {
      value = 1
      unit = "M"
    } else if (unit === "M") {
      value = 1
      unit = "G"
    }
  }

  const formatted = value.toFixed(1).replace(/\.0$/, "")
  return (num < 0 ? "-" : "") + formatted + unit
}

/**
 * CacheStatsView 组件属性
 */
interface CacheStatsViewProps {
  api: TuiPluginApi
  session_id: string
}

/**
 * 单个 session 的缓存命中率显示组件
 */
function CacheStatsView(props: CacheStatsViewProps) {
  const theme = props.api.theme.current

  const stats = createMemo(() => {
    const messages = props.api.state.session.messages(props.session_id)

    // 从后往前找最后一条有效的 assistant 消息
    const msg = messages
      .slice()
      .reverse()
      .find(
        (m): m is AssistantMessage =>
          m.role === "assistant" &&
          m.tokens !== undefined &&
          m.tokens.output > 0
      )

    if (!msg) {
      return null
    }

    const cacheRead = msg.tokens.cache?.read ?? 0
    const inputTokens = msg.tokens.input ?? 0
    const total = cacheRead + inputTokens

    if (total === 0) {
      return null
    }

    const hitRate = (cacheRead / total) * 100

    return {
      hitRate,
      cacheRead,
      total,
    }
  })

  const color = createMemo(() => {
    const s = stats()
    if (!s) return theme().textMuted
    if (s.hitRate >= 80) return theme().success
    if (s.hitRate >= 50) return theme().warning
    return theme().error
  })

  return (
    <div style={{ padding: "0 1", margin: "1 0" }}>
      <div style={{ fontWeight: "bold" }}>Cache Hit Rate</div>
      <div style={{ color: color() }}>
        {stats() ? `${stats()!.hitRate.toFixed(1)}%` : "--"}
      </div>
      <div style={{ color: theme().textMuted }}>
        {stats()
          ? `${formatNumber(stats()!.cacheRead)} cached / ${formatNumber(stats()!.total)}`
          : "--"}
      </div>
    </div>
  )
}

/**
 * TUI 插件入口
 */
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

export default { id: "cache-stats", tui } satisfies { id: string; tui: TuiPlugin }
