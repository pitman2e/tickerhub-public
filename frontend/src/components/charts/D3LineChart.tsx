import { useMemo, useRef, useState } from "react";
import { extent } from "d3-array";
import { format as d3Format } from "d3-format";
import { scaleLinear } from "d3-scale";
import { area as d3Area, line as d3Line } from "d3-shape";
import Box from "@mui/material/Box";
import colors from "../../ui/colors";
import { IChartAxis, IChartDataset, IChartTooltipOptions, IChartTooltipState } from "../../types/chart";
import { ChartXAxis, ChartYAxis, D3ChartTooltip, IChartTick } from "./ChartPrimitives";
import { useChartDimensions } from "./useChartDimensions";

interface ID3LineChartProps {
  labels: string[];
  datasets: IChartDataset[];
  tooltip: IChartTooltipOptions;
  yAxis?: IChartAxis;
  /** Hides the x axis entirely. */
  showXAxis?: boolean;
  /** Formats an x tick label. */
  xTickFormat?: (label: string, index: number) => string;
  /** Maximum number of x ticks; longer series are thinned. */
  xTickCount?: number;
  /** Fallback series colour. */
  defaultColor?: string;
  /** Fallback point radius for series that do not set one. */
  pointRadius?: number;
  /** Axis/label text colour. */
  textColor?: string;
}

interface IPoint {
  index: number;
  value: number | null;
}

const defaultYtickFormat = d3Format(",");

// Delay before dismissing the tooltip.
const tooltipClearDelayMs = 50;

function getDomain(
  datasets: IChartDataset[],
  yAxis: IChartAxis | undefined,
): [number, number] {
  const values = datasets
    .flatMap((dataset) => dataset.data)
    .filter((value): value is number => value !== null);

  const [dataMin, dataMax] = extent(values) as [number | undefined, number | undefined];
  let min = dataMin ?? 0;
  let max = dataMax ?? 1;

  if (min === max) {
    min -= 1;
    max += 1;
  }

  return [yAxis?.min ?? min, yAxis?.max ?? max];
}

export function D3LineChart({
  labels,
  datasets,
  tooltip,
  yAxis,
  showXAxis = true,
  xTickFormat,
  xTickCount,
  defaultColor,
  pointRadius,
  textColor,
}: ID3LineChartProps) {
  const { containerRef, dimensions } = useChartDimensions();
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipState, setTooltipState] = useState<IChartTooltipState | null>(
    null,
  );

  const { width, height } = dimensions;
  const margin = {
    top: 8,
    right: 8,
    bottom: showXAxis ? 24 : 4,
    left: yAxis?.hidden ? 4 : 48,
  };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const step = labels.length > 1 ? innerWidth / (labels.length - 1) : 0;
  const xAt = (index: number) => index * step;

  const [domainMin, domainMax] = useMemo(
    () => getDomain(datasets, yAxis),
    [datasets, yAxis],
  );
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([domainMin, domainMax])
        .nice()
        .range([innerHeight, 0]),
    [domainMin, domainMax, innerHeight],
  );

  const yTicks: IChartTick[] = useMemo(() => {
    const tickValues =
      yAxis?.tickValues ??
      yScale.ticks(Math.max(2, Math.floor(innerHeight / 40)));
    const tickFormat = yAxis?.tickFormat ?? defaultYtickFormat;
    return tickValues.map((value) => ({
      position: yScale(value),
      label: tickFormat(value),
    }));
  }, [yAxis, yScale, innerHeight]);

  const xTicks: IChartTick[] = useMemo(() => {
    if (!showXAxis || labels.length === 0) {
      return [];
    }

    const maxTicks = xTickCount ?? Math.max(2, Math.floor(innerWidth / 60));
    const tickStep = Math.max(1, Math.ceil(labels.length / maxTicks));
    const indices: number[] = [];
    for (let index = 0; index < labels.length; index += tickStep) {
      indices.push(index);
    }
    if (indices[indices.length - 1] !== labels.length - 1) {
      indices.push(labels.length - 1);
    }

    return indices.map((index) => ({
      position: xAt(index),
      label: xTickFormat ? xTickFormat(labels[index], index) : labels[index],
    }));
  }, [labels, showXAxis, xTickCount, innerWidth, xTickFormat, step]);

  const indexFromClientX = (clientX: number): number | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || labels.length === 0) {
      return null;
    }

    const localX = clientX - rect.left - margin.left;
    if (step === 0) {
      return 0;
    }

    return Math.min(labels.length - 1, Math.max(0, Math.round(localX / step)));
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
      .filter((row) => row !== "");

    if (rows.length === 0) {
      setActiveIndex(null);
      setTooltipState(null);
      return;
    }

    setActiveIndex(index);
    setTooltipState({
      x: margin.left + xAt(index),
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

  const handleTouchMove = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchStart = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    handleMove(touch.clientX, touch.clientY);
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
        onPointerMove={handlePointerMove}
        onPointerLeave={scheduleHide}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={scheduleHide}
        onTouchCancel={scheduleHide}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {!yAxis?.hidden && <ChartYAxis ticks={yTicks} innerWidth={innerWidth} color={textColor} fontSize={yAxis?.tickFontSize} />}
          {showXAxis && <ChartXAxis ticks={xTicks} innerHeight={innerHeight} color={textColor} />}

          {datasets.map((dataset, datasetIndex) => {
            const color =
              dataset.color ?? defaultColor ?? colors[datasetIndex % colors.length];
            const points: IPoint[] = labels.map((_, index) => ({
              index,
              value: dataset.data[index] ?? null,
            }));
            const defined = (point: IPoint) => point.value !== null;

            if (dataset.segmentColor) {
              return (
                <g key={datasetIndex} data-testid="d3-line-dataset">
                  {points.slice(0, -1).map((point, index) => {
                    const next = points[index + 1];
                    if (!defined(point) || !defined(next)) {
                      return null;
                    }
                    const stroke =
                      dataset.segmentColor?.(point.value, next.value) ?? color;
                    return (
                      <line
                        key={index}
                        x1={xAt(point.index)}
                        y1={yScale(point.value as number)}
                        x2={xAt(next.index)}
                        y2={yScale(next.value as number)}
                        stroke={stroke}
                        strokeWidth={dataset.borderWidth ?? 1.5}
                      />
                    );
                  })}
                </g>
              );
            }

            const lineGen = d3Line<IPoint>()
              .defined(defined)
              .x((point) => xAt(point.index))
              .y((point) => yScale(point.value as number));
            const areaGen = d3Area<IPoint>()
              .defined(defined)
              .x((point) => xAt(point.index))
              .y0(innerHeight)
              .y1((point) => yScale(point.value as number));

            return (
              <g key={datasetIndex} data-testid="d3-line-dataset">
                {dataset.fill && (
                  <path
                    d={areaGen(points) ?? undefined}
                    fill={color}
                    fillOpacity={dataset.fillOpacity ?? 0.25}
                  />
                )}
                <path
                  d={lineGen(points) ?? undefined}
                  fill="none"
                  stroke={color}
                  strokeWidth={dataset.borderWidth ?? 1.5}
                  strokeDasharray={dataset.borderDash?.join(" ")}
                />
              </g>
            );
          })}

          {datasets.map((dataset, datasetIndex) => {
            const color =
              dataset.color ?? defaultColor ?? colors[datasetIndex % colors.length];
            const radius = dataset.pointRadius ?? pointRadius ?? 3;
            if (radius <= 0) {
              return null;
            }
            return (
              <g key={datasetIndex} data-testid="d3-line-points">
                {dataset.data.map((value, index) => {
                  if (value === null) {
                    return null;
                  }
                  const isActive = activeIndex === index;
                  return (
                    <circle
                      key={index}
                      cx={xAt(index)}
                      cy={yScale(value)}
                      r={isActive ? radius + 2 : radius}
                      fill={dataset.pointColor?.(value) ?? color}
                      stroke={isActive ? "#fff" : "none"}
                      strokeWidth={isActive ? 1.5 : 0}
                    />
                  );
                })}
              </g>
            );
          })}

          {activeIndex !== null && (
            <line
              data-testid="d3-line-highlight"
              x1={xAt(activeIndex)}
              x2={xAt(activeIndex)}
              y1={0}
              y2={innerHeight}
              stroke={textColor ?? "#999"}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
        </g>
      </svg>
      <D3ChartTooltip state={tooltipState} color={tooltip.color} />
    </Box>
  );
}
