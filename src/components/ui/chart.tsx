"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return ctx
}

export interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`

    const style = React.useMemo(() => {
      const vars: Record<string, string> = {}
      for (const [key, item] of Object.entries(config)) {
        if (item.color) {
          vars[`--color-${key}`] = item.color
        }
      }
      return vars as React.CSSProperties
    }, [config])

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  value?: unknown
  name?: unknown
  dataKey?: unknown
  color?: string
  payload?: unknown
}

export type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: unknown
  formatter?: (
    value: unknown,
    name: unknown,
    item: TooltipPayloadItem,
    index: number,
    fullPayload: TooltipPayloadItem[]
  ) => React.ReactNode | [React.ReactNode, React.ReactNode]
  labelFormatter?: (label: unknown) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ active, payload, label, formatter, className, ...props }, ref) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-md",
          className
        )}
        {...props}
      >
        {label != null && <div className="font-medium">{String(label)}</div>}
        <div className="grid gap-1">
          {payload.map((item, i) => {
            const out = formatter
              ? formatter(item.value, item.name, item, i, payload)
              : [String(item.value ?? ""), String(item.name ?? "")] as const
            const valueNode = Array.isArray(out) ? out[0] : out
            const nameNode = Array.isArray(out) ? out[1] : item.name
            return (
              <div key={i} className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground">{nameNode as React.ReactNode}</span>
                <span className="font-mono font-medium tabular-nums">{valueNode}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent, useChart }
