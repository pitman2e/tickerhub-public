/** A single series rendered by the shared d3 chart components. */
export interface IChartDataset {
  /** Numeric values aligned with the chart labels; null leaves a gap. */
  data: (number | null)[];
  /** Legend/tooltip label for the dataset. */
  label?: string;
  /** Currency code prefixed to the value in the tooltip. */
  currency?: string;
  /** Explicit series colour; falls back to the chart default. */
  color?: string;
  /** Per-point colours (bars/pie slices); falls back to the shared palette. */
  customBackgroundColor?: string[];
  /** Fill the area under a line. */
  fill?: boolean;
  /** Stroke width in pixels. */
  borderWidth?: number;
  /** Dash pattern for the stroke. */
  borderDash?: number[];
  /** Point radius in pixels; 0 hides the points. */
  pointRadius?: number;
  /** Opacity of the filled area when `fill` is set. */
  fillOpacity?: number;
  /** Stroke colour for the segment joining two adjacent points. */
  segmentColor?: (
    previous: number | null,
    next: number | null,
  ) => string | undefined;
  /** Fill colour for an individual point marker. */
  pointColor?: (value: number | null) => string | undefined;
}

/** Axis configuration shared by the line and bar charts. */
export interface IChartAxis {
  /** Fixed axis minimum; defaults to the data extent. */
  min?: number;
  /** Fixed axis maximum; defaults to the data extent. */
  max?: number;
  /** Only draw ticks/gridlines at these values. */
  tickValues?: number[];
  /** Formats an axis value for display. */
  tickFormat?: (value: number) => string;
  /** Hides the axis. */
  hidden?: boolean;
  /** Font size for the tick labels. */
  tickFontSize?: number;
  /** Optional text opacity per tick value, e.g. to fade secondary labels. */
  tickOpacity?: (value: number) => number;
  /** Optional gridline opacity per tick value; defaults to fully opaque. */
  gridOpacity?: (value: number) => number;
  /** Nudges labels apart when their tick positions are too close to read. */
  spreadLabels?: boolean;
}

/** Context passed to a chart tooltip formatter. */
export interface IChartTooltipContext {
  index: number;
  label: string;
  value: number | null;
  dataset: IChartDataset;
  datasetIndex: number;
}

/** Position and content of the floating tooltip. */
export interface IChartTooltipState {
  x: number;
  y: number;
  title?: string;
  rows: string[];
}

export interface IChartTooltipOptions {
  /** Builds one tooltip row per hovered dataset; return "" to omit it. */
  format: (context: IChartTooltipContext) => string;
  /** Restricts which datasets appear in the tooltip. */
  includeDataset?: (datasetIndex: number) => boolean;
  /** Colour of the tooltip text. */
  color?: string;
}
