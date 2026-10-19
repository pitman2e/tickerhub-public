import Box from "@mui/material/Box";
import { format as d3Format } from "d3-format";
import { IChartTooltipState } from "../../types/chart";

// Values of a million or more get a K suffix (thousands) so long y tick labels
// still fit; decimals are discarded and millions are not abbreviated.
const kSuffixThreshold = 1_000_000;

/** Default y-axis tick formatter that shortens large numbers with a K suffix. */
export function defaultYAxisTickFormat(value: number): string {
  if (Math.abs(value) >= kSuffixThreshold) {
    return `${Math.trunc(value / 1000)}K`;
  }

  return d3Format(",")(value);
}

/** A tick rendered on a chart axis. */
export interface IChartTick {
  position: number;
  label: string;
  /** Optional text opacity; defaults to fully opaque. */
  opacity?: number;
  /** Optional gridline opacity; defaults to fully opaque. */
  gridOpacity?: number;
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
  innerHeight?: number;
  color?: string;
  gridColor?: string;
  fontSize?: number;
  /** Nudges labels apart when their tick positions are too close to read. */
  spreadLabels?: boolean;
}

// Spaces labels in a cluster around the cluster's centre so nearly coincident
// ticks stay readable. Gridlines keep their true value; only labels move.
export function getSpreadLabelPositions(
  positions: number[],
  fontSize: number,
  maxPosition: number,
): number[] {
  const minGap = fontSize + 2;
  const ordered = positions
    .map((position, index) => ({ index, position }))
    .sort((a, b) => a.position - b.position);
  const labelPositions = [...positions];

  let clusterStart = 0;
  while (clusterStart < ordered.length) {
    let clusterEnd = clusterStart;
    while (
      clusterEnd + 1 < ordered.length &&
      ordered[clusterEnd + 1].position - ordered[clusterEnd].position < minGap
    ) {
      clusterEnd++;
    }

    const clusterSize = clusterEnd - clusterStart + 1;
    if (clusterSize > 1) {
      const clusterCenter =
        (ordered[clusterStart].position + ordered[clusterEnd].position) / 2;
      const start = Math.min(
        Math.max(clusterCenter - ((clusterSize - 1) * minGap) / 2, 0),
        Math.max(0, maxPosition - (clusterSize - 1) * minGap),
      );
      for (let offset = 0; offset < clusterSize; offset++) {
        labelPositions[ordered[clusterStart + offset].index] =
          start + offset * minGap;
      }
    }

    clusterStart = clusterEnd + 1;
  }

  return labelPositions;
}

// Horizontal axis drawn on the left: a gridline plus a right-aligned label.
export function ChartYAxis({
  ticks,
  innerWidth,
  innerHeight = Number.POSITIVE_INFINITY,
  color,
  gridColor = "rgba(128, 128, 128, 0.25)",
  fontSize = 10,
  spreadLabels = false,
}: IChartYAxisProps) {
  const labelPositions = spreadLabels
    ? getSpreadLabelPositions(
      ticks.map((tick) => tick.position),
      fontSize,
      innerHeight,
    )
    : ticks.map((tick) => tick.position);

  return (
    <g data-testid="d3-chart-y-axis">
      {ticks.map((tick, index) => (
        <g key={tick.position} transform={`translate(0, ${tick.position})`}>
          <line
            x1={0}
            x2={innerWidth}
            stroke={gridColor}
            strokeWidth={1}
            opacity={tick.gridOpacity}
          />
          <text
            x={-6}
            y={labelPositions[index] - tick.position}
            dy="0.32em"
            textAnchor="end"
            fill={color}
            fontSize={fontSize}
            opacity={tick.opacity}
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
  /** Rotation in degrees applied to the tick labels; zero keeps them horizontal. */
  angle?: number;
}

// Horizontal axis drawn along the bottom, with centered labels. When angled,
// labels are anchored at their tick and run down-left so more text fits.
export function ChartXAxis({
  ticks,
  innerHeight,
  color,
  fontSize = 10,
  angle = 0,
}: IChartXAxisProps) {
  const angled = angle !== 0;
  return (
    <g data-testid="d3-chart-x-axis">
      {ticks.map((tick) => (
        <text
          key={tick.position}
          x={angled ? 0 : tick.position}
          y={angled ? 0 : innerHeight + 14}
          transform={
            angled
              ? `translate(${tick.position}, ${innerHeight + 14}) rotate(${angle})`
              : undefined
          }
          textAnchor={angled ? "end" : "middle"}
          fill={color}
          fontSize={fontSize}
        >
          {tick.label}
        </text>
      ))}
    </g>
  );
}
