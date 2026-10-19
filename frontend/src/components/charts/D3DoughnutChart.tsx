import { useMemo, useRef, useState } from "react";
import { arc as d3Arc, pie as d3Pie, PieArcDatum } from "d3-shape";
import Box from "@mui/material/Box";
import colors from "../../ui/colors";
import { IChartTooltipState } from "../../types/chart";
import { D3ChartTooltip } from "./ChartPrimitives";
import { useChartDimensions } from "./useChartDimensions";

interface ID3DoughnutChartProps {
  labels: string[];
  data: number[];
  /** Per-slice colours (fallback to the shared palette). */
  colors?: string[];
  /** Currency code prefixed to the value in the tooltip. */
  currency?: string;
  /** Legend label colour. */
  legendColor?: string;
  /** Shows the legend on the right. Defaults to true. */
  showLegend?: boolean;
}

interface ISlice {
  index: number;
  value: number;
}

const legendItemHeight = 20;
const legendSwatchSize = 12;

// Delay before dismissing the tooltip.
const tooltipClearDelayMs = 50;

export function D3DoughnutChart({
  labels,
  data,
  colors: sliceColors,
  currency,
  legendColor,
  showLegend = true,
}: ID3DoughnutChartProps) {
  const { containerRef, dimensions } = useChartDimensions();
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);

  const { width, height } = dimensions;
  const legendWidth = showLegend ? Math.min(220, width * 0.4) : 0;
  const chartWidth = Math.max(0, width - legendWidth);
  const center = { x: chartWidth / 2, y: height / 2 };
  const outerRadius = Math.max(0, Math.min(chartWidth, height) / 2 - 12);
  const innerRadius = outerRadius * 0.5;

  const visibleSlices: ISlice[] = useMemo(
    () =>
      data
        .map((value, index) => ({ index, value }))
        .filter((slice) => !hiddenIndices.includes(slice.index)),
    [data, hiddenIndices],
  );

  const sliceColor = (index: number) =>
    sliceColors?.[index] || colors[index % colors.length];

  const arcs = useMemo(
    () =>
      d3Pie<ISlice>()
        .value((slice) => slice.value)
        .sort(null)(visibleSlices),
    [visibleSlices],
  );
  const arcGen = d3Arc<PieArcDatum<ISlice>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  const visibleTotal = visibleSlices.reduce(
    (total, slice) => total + slice.value,
    0,
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipState, setTooltipState] = useState<IChartTooltipState | null>(
    null,
  );

  const clearPendingHide = () => {
    if (hideTimeoutRef.current !== undefined) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
  };

  const scheduleHide = () => {
    clearPendingHide();
    hideTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(null);
      setTooltipState(null);
    }, tooltipClearDelayMs);
  };

  const showTooltip = (arc: PieArcDatum<ISlice>) => {
    clearPendingHide();
    const label = labels[arc.data.index] ?? "";
    const value = arc.data.value;
    const percentage =
      visibleTotal > 0 ? ((100 * value) / visibleTotal).toFixed(2) : "0.00";
    const formattedValue =
      (currency ? currency + " " : "") + value.toFixed(2);
    const [cx, cy] = arcGen.centroid(arc);

    setActiveIndex(arc.data.index);
    setTooltipState({
      x: center.x + cx,
      y: center.y + cy,
      rows: [` ${label} : ${formattedValue} (${percentage}%)`],
    });
  };

  const toggleSlice = (index: number) => {
    setHiddenIndices((previous) =>
      previous.includes(index)
        ? previous.filter((value) => value !== index)
        : [...previous, index],
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", width: "100%", height: "100%" }}
    >
      <svg
        style={{ display: "block" }}
        width={width}
        height={height}
        role="img"
        onPointerLeave={scheduleHide}
        onTouchEnd={scheduleHide}
        onTouchCancel={scheduleHide}
      >
        <g transform={`translate(${center.x}, ${center.y})`}>
          <g data-testid="d3-doughnut-slices">
            {arcs.map((arc) => (
              <path
                key={arc.data.index}
                d={arcGen(arc) ?? undefined}
                fill={sliceColor(arc.data.index)}
                opacity={
                  activeIndex === null || activeIndex === arc.data.index
                    ? 1
                    : 0.6
                }
                onMouseEnter={() => showTooltip(arc)}
                onMouseLeave={scheduleHide}
                onTouchStart={() => showTooltip(arc)}
              />
            ))}
          </g>
        </g>

        {showLegend && (
          <g
            data-testid="d3-doughnut-legend"
            transform={`translate(${chartWidth}, 0)`}
          >
            {labels.map((label, index) => {
              const top =
                Math.max(
                  4,
                  (height - labels.length * legendItemHeight) / 2,
                ) + index * legendItemHeight;
              const isHidden = hiddenIndices.includes(index);
              return (
                <g
                  key={index}
                  transform={`translate(8, ${top})`}
                  onClick={() => toggleSlice(index)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={legendSwatchSize}
                    height={legendSwatchSize}
                    fill={sliceColor(index)}
                    opacity={isHidden ? 0.4 : 1}
                  />
                  <text
                    x={legendSwatchSize + 8}
                    y={legendSwatchSize / 2}
                    dy="0.32em"
                    fill={legendColor}
                    fontSize={12}
                    opacity={isHidden ? 0.5 : 1}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
      <D3ChartTooltip state={tooltipState} />
    </Box>
  );
}
