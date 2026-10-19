import Box from "@mui/material/Box";
import { IChartTooltipState } from "../../types/chart";

/** A tick rendered on a chart axis. */
export interface IChartTick {
  position: number;
  label: string;
}

interface IChartTooltipProps {
  state: IChartTooltipState | null;
  color?: string;
}

// Floating tooltip shared by the d3 charts. Positioned in container pixels so
// it can follow the pointer.
export function D3ChartTooltip({ state, color }: IChartTooltipProps) {
  if (!state) {
    return null;
  }

  return (
    <Box
      data-testid="d3-chart-tooltip"
      sx={{
        position: "absolute",
        pointerEvents: "none",
        left: state.x,
        top: state.y,
        transform: "translate(-50%, calc(-100% - 8px))",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: color ?? "#fff",
        borderRadius: 1,
        px: 1,
        py: 0.5,
        fontSize: 12,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        zIndex: 1,
      }}
    >
      {state.title !== undefined && <div>{state.title}</div>}
      {state.rows.map((row, index) => (
        <div key={index}>{row}</div>
      ))}
    </Box>
  );
}

interface IChartYAxisProps {
  ticks: IChartTick[];
  innerWidth: number;
  color?: string;
  gridColor?: string;
  fontSize?: number;
}

// Horizontal axis drawn on the left: a gridline plus a right-aligned label.
export function ChartYAxis({
  ticks,
  innerWidth,
  color,
  gridColor = "rgba(128, 128, 128, 0.25)",
  fontSize = 10,
}: IChartYAxisProps) {
  return (
    <g data-testid="d3-chart-y-axis">
      {ticks.map((tick) => (
        <g key={tick.position} transform={`translate(0, ${tick.position})`}>
          <line x1={0} x2={innerWidth} stroke={gridColor} strokeWidth={1} />
          <text
            x={-6}
            dy="0.32em"
            textAnchor="end"
            fill={color}
            fontSize={fontSize}
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}

interface IChartXAxisProps {
  ticks: IChartTick[];
  innerHeight: number;
  color?: string;
  fontSize?: number;
}

// Horizontal axis drawn along the bottom, with centered labels.
export function ChartXAxis({
  ticks,
  innerHeight,
  color,
  fontSize = 10,
}: IChartXAxisProps) {
  return (
    <g data-testid="d3-chart-x-axis">
      {ticks.map((tick) => (
        <text
          key={tick.position}
          x={tick.position}
          y={innerHeight + 14}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
        >
          {tick.label}
        </text>
      ))}
    </g>
  );
}
