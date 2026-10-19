import { useMemo, useRef, useState } from "react";
import { extent } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import Box from "@mui/material/Box";
import colors from "../../ui/colors";
import {
  IChartAxis,
  IChartDataset,
  IChartTooltipContext,
  IChartTooltipOptions,
  IChartTooltipState,
} from "../../types/chart";
import {
  ChartXAxis,
  ChartYAxis,
  D3ChartTooltip,
  IChartTick,
  defaultYAxisTickFormat,
} from "./ChartPrimitives";
import { useChartDimensions } from "./useChartDimensions";

interface ID3BarChartProps {
  labels: string[];
  datasets: IChartDataset[];
  /** Mouse-over tooltip; omit to disable it. */
  tooltip?: IChartTooltipOptions;
  /** Formats a label drawn next to each bar; omit to hide the labels. */
  valueLabel?: (context: IChartTooltipContext) => string;
  yAxis?: IChartAxis;
  /** Hides the x axis entirely. */
  showXAxis?: boolean;
  /** Formats an x tick label. */
  xTickFormat?: (label: string, index: number) => string;
  /** Maximum number of x ticks; longer series are thinned. */
  xTickCount?: number;
  /** Fallback series colour. */
  defaultColor?: string;
  /** Axis/label text colour. */
  textColor?: string;
  /** Includes zero in the y domain so bars share a baseline. Defaults to true. */
  includeZero?: boolean;
}

// Delay before dismissing the tooltip.
const tooltipClearDelayMs = 50;

// X tick labels longer than this are rotated so more of them fit on the axis.
const xLabelAngleThreshold = 6;
const xLabelAngle = -45;
// Font size used for x tick labels and its approximate glyph width ratio, used
// to reserve vertical space for rotated labels.
const xAxisFontSize = 10;
const xLabelCharWidthRatio = 0.6;
// Show roughly twice as many x ticks as a single row of labels would allow.
const xTickDensityMultiplier = 2;

function getDomain(
  datasets: IChartDataset[],
  yAxis: IChartAxis | undefined,
  includeZero: boolean,
): [number, number] {
  const values = datasets
    .flatMap((dataset) => dataset.data)
    .filter((value): value is number => value !== null);

  const [dataMin, dataMax] = extent(values) as [
    number | undefined,
    number | undefined,
  ];
  let min = dataMin ?? 0;
  let max = dataMax ?? 1;

  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  if (min === max) {
    min -= 1;
    max += 1;
  }

  return [yAxis?.min ?? min, yAxis?.max ?? max];
}

export function D3BarChart({
  labels,
  datasets,
  tooltip,
  valueLabel,
  yAxis,
  showXAxis = true,
  xTickFormat,
  xTickCount,
  defaultColor,
  textColor,
  includeZero = true,
}: ID3BarChartProps) {
  const { containerRef, dimensions } = useChartDimensions();
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipState, setTooltipState] = useState<IChartTooltipState | null>(
    null,
  );

  const { width, height } = dimensions;

  const formattedLabels = useMemo(
    () =>
      labels.map((label, index) =>
        xTickFormat ? xTickFormat(label, index) : label,
      ),
    [labels, xTickFormat],
  );
  const longestXLabel = useMemo(
    () => formattedLabels.reduce((max, label) => Math.max(max, label.length), 0),
    [formattedLabels],
  );
  const xLabelRotation =
    longestXLabel > xLabelAngleThreshold ? xLabelAngle : 0;
  const xLabelAngleRadians = (Math.abs(xLabelRotation) * Math.PI) / 180;
  const estimatedLabelWidth =
    longestXLabel * xAxisFontSize * xLabelCharWidthRatio;
  // Vertical extent of a rotated label below its tick.
  const rotatedLabelHeight =
    xLabelRotation === 0
      ? 0
      : Math.ceil(Math.sin(xLabelAngleRadians) * estimatedLabelWidth);
  // Minimum horizontal gap between ticks so labels do not overlap.
  const minXLabelSpacing = Math.max(
    60,
    Math.ceil(
      (xLabelRotation === 0
        ? estimatedLabelWidth
        : Math.cos(xLabelAngleRadians) * estimatedLabelWidth) + 8,
    ),
  );

  const margin = {
    top: valueLabel ? 16 : 8,
    right: 8,
    bottom: showXAxis ? Math.max(24, 14 + rotatedLabelHeight + 4) : 4,
    left: yAxis?.hidden ? 4 : 48,
  };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const [domainMin, domainMax] = useMemo(
    () => getDomain(datasets, yAxis, includeZero),
    [datasets, yAxis, includeZero],
  );
  const yScale = useMemo(
    () =>
      scaleLinear().domain([domainMin, domainMax]).nice().range([innerHeight, 0]),
    [domainMin, domainMax, innerHeight],
  );

  const xScale = useMemo(
    () =>
      scaleBand<number>()
        .domain(labels.map((_, index) => index))
        .range([0, innerWidth])
        .paddingInner(0.2)
        .paddingOuter(0.1),
    [labels, innerWidth],
  );
  const bandWidth = xScale.bandwidth();
  const bandCenter = (index: number) => (xScale(index) ?? 0) + bandWidth / 2;

  const yTicks: IChartTick[] = useMemo(() => {
    const tickValues =
      yAxis?.tickValues ??
      yScale.ticks(Math.max(2, Math.floor(innerHeight / 40)));
    const tickFormat = yAxis?.tickFormat ?? defaultYAxisTickFormat;
    return tickValues.map((value) => ({
      position: yScale(value),
      label: tickFormat(value),
      opacity: yAxis?.tickOpacity?.(value),
      gridOpacity: yAxis?.gridOpacity?.(value),
    }));
  }, [yAxis, yScale, innerHeight]);

  const xTicks: IChartTick[] = useMemo(() => {
    if (!showXAxis || labels.length === 0) {
      return [];
    }

    const maxTicks =
      xTickCount ??
      Math.max(
        2,
        Math.floor((innerWidth / minXLabelSpacing) * xTickDensityMultiplier),
      );
    const tickStep = Math.max(1, Math.ceil(labels.length / maxTicks));
    const indices: number[] = [];
    for (let index = 0; index < labels.length; index += tickStep) {
      indices.push(index);
    }

    return indices.map((index) => ({
      position: bandCenter(index),
      label: formattedLabels[index],
    }));
  }, [labels, showXAxis, xTickCount, innerWidth, formattedLabels, minXLabelSpacing, xScale]);

  const indexFromClientX = (clientX: number): number | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || labels.length === 0) {
      return null;
    }

    const localX = clientX - rect.left - margin.left;
    const step = xScale.step();
    if (step === 0) {
      return 0;
    }
    return Math.min(labels.length - 1, Math.max(0, Math.floor(localX / step)));
  };

  const scheduleHide = () => {
    if (hideTimeoutRef.current !== undefined) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(null);
      setTooltipState(null);
    }, tooltipClearDelayMs);
  };

  const showTooltip = (index: number, clientY: number) => {
    if (tooltip === undefined) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const localY = rect ? clientY - rect.top : margin.top;

    const rows = datasets
      .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
      .filter(({ datasetIndex }) =>
        tooltip.includeDataset ? tooltip.includeDataset(datasetIndex) : true,
      )
      .map(({ dataset, datasetIndex }) =>
        tooltip.format({
          index,
          label: labels[index],
          value: dataset.data[index] ?? null,
          dataset,
          datasetIndex,
        }),
      )
      .filter((row) => row !== "")
      .map((row) => `${labels[index]}: ${row}`);

    setActiveIndex(index);
    setTooltipState({
      x: margin.left + bandCenter(index),
      y: Math.min(Math.max(localY, margin.top), height - margin.bottom),
      rows,
    });
  };

  const handleMove = (clientX: number, clientY: number) => {
    const index = indexFromClientX(clientX);
    if (index === null) {
      return;
    }
    showTooltip(index, clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    handleMove(event.clientX, event.clientY);
  };

  const handleTouchStart = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const baseline = yScale(0);
  const datasetCount = Math.max(1, datasets.length);
  const subWidth = bandWidth / datasetCount;

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
        onPointerMove={tooltip ? handlePointerMove : undefined}
        onPointerLeave={tooltip ? scheduleHide : undefined}
        onTouchStart={tooltip ? handleTouchStart : undefined}
        onTouchMove={tooltip ? handleTouchMove : undefined}
        onTouchEnd={tooltip ? scheduleHide : undefined}
        onTouchCancel={tooltip ? scheduleHide : undefined}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {!yAxis?.hidden && (
            <ChartYAxis
              ticks={yTicks}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
              color={textColor}
              fontSize={yAxis?.tickFontSize}
              spreadLabels={yAxis?.spreadLabels}
            />
          )}
          {showXAxis && (
            <ChartXAxis
              ticks={xTicks}
              innerHeight={innerHeight}
              color={textColor}
              angle={xLabelRotation}
            />
          )}

          {activeIndex !== null && (
            <rect
              data-testid="d3-bar-highlight"
              x={xScale(activeIndex)}
              y={0}
              width={bandWidth}
              height={innerHeight}
              fill="rgba(128, 128, 128, 0.15)"
            />
          )}

          <g data-testid="d3-bar-bars">
            {labels.map((_, index) => {
              return datasets.map((dataset, datasetIndex) => {
                const value = dataset.data[index] ?? null;
                if (value === null) {
                  return null;
                }
                const color =
                  dataset.customBackgroundColor?.[index] ||
                  dataset.color ||
                  defaultColor ||
                  colors[datasetIndex % colors.length];
                const x = (xScale(index) ?? 0) + datasetIndex * subWidth;
                const barWidth = Math.max(1, subWidth * 0.9);
                const y = value >= 0 ? yScale(value) : baseline;
                const barHeight = Math.abs(yScale(value) - baseline);
                return (
                  <rect
                    key={`${datasetIndex}-${index}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                  />
                );
              });
            })}
          </g>

          {valueLabel && (
            <g data-testid="d3-bar-value-labels">
              {labels.map((_, index) =>
                datasets.map((dataset, datasetIndex) => {
                  const value = dataset.data[index] ?? null;
                  if (value === null) {
                    return null;
                  }
                  const label = valueLabel({
                    index,
                    label: labels[index],
                    value,
                    dataset,
                    datasetIndex,
                  });
                  if (label === "") {
                    return null;
                  }
                  const x =
                    (xScale(index) ?? 0) +
                    datasetIndex * subWidth +
                    Math.max(1, subWidth * 0.9) / 2;
                  const y = value >= 0 ? yScale(value) - 4 : yScale(value) + 14;
                  return (
                    <text
                      key={`${datasetIndex}-${index}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={10}
                    >
                      {label}
                    </text>
                  );
                }),
              )}
            </g>
          )}
        </g>
      </svg>
      <D3ChartTooltip state={tooltipState} color={tooltip?.color} />
    </Box>
  );
}
