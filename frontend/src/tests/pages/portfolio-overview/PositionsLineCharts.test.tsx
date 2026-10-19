import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PositionsLineCharts } from "../../../pages/portfolio-overview/PositionsLineCharts";

const { chartData } = vi.hoisted(() => ({
  chartData: {
    labels: ["2026-01-01", "2026-01-02"],
    unrealisedDatasets: [{ data: [100, 110], currency: "HKD" }],
    totalGainDatasets: [{ data: [10, 20], currency: "HKD" }],
    totalGainOffsetDatasets: [{ data: [10, 20], currency: "HKD" }],
    dailyGainDatasets: [{ data: [1, 2], currency: "HKD" }],
    unrealisedCostDatasets: [{ data: [90, 90], currency: "HKD" }],
    dailyRealisedDividendDatasets: [{ data: [0, 1], currency: "HKD" }],
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: chartData,
    isFetching: false,
    isSuccess: true,
    isError: false,
  }),
}));

vi.mock("@mui/material/styles", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@mui/material/styles")>();
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: { main: "blue" },
        text: { primary: "black" },
      },
    }),
  };
});

vi.mock("../../../components/DateRangeSelector", () => ({
  default: () => null,
  getPresetDates: () => ({
    from: { unix: () => 1704067200 },
    to: { unix: () => 1767225600 },
  }),
}));

const getSvgs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[role='img']"));

describe("PositionsLineCharts d3 rendering", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders one d3 chart per position metric", () => {
    const { container } = render(<PositionsLineCharts portfolioId="IB-HKD" />);

    expect(getSvgs(container)).toHaveLength(6);
    expect(
      container.querySelectorAll("[data-testid='d3-line-dataset']"),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll("[data-testid='d3-bar-bars']"),
    ).toHaveLength(2);
    // Two values per bar chart, two bar charts.
    expect(
      container.querySelectorAll("[data-testid='d3-bar-bars'] rect"),
    ).toHaveLength(4);
  });

  it("shows the dataset currency and value in a tooltip on pointer move", () => {
    const { container } = render(<PositionsLineCharts portfolioId="IB-HKD" />);

    // The first chart plots unrealisedDatasets [100, 110]; target index 1.
    fireEvent.pointerMove(getSvgs(container)[0], {
      clientX: 492,
      clientY: 40,
    });

    expect(screen.getByTestId("d3-chart-tooltip").textContent).toContain(
      "HKD 110.00",
    );
  });

  it("dismisses the tooltip after a touch sequence ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    const { container } = render(<PositionsLineCharts portfolioId="IB-HKD" />);

    const svg = getSvgs(container)[0];
    fireEvent.touchStart(svg, { touches: [{ clientX: 492, clientY: 40 }] });
    expect(screen.getByTestId("d3-chart-tooltip")).toBeTruthy();

    fireEvent.touchEnd(svg);
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });
});
