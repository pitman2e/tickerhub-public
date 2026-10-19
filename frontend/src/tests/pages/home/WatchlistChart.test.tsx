import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import dayjs from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import WatchlistChart from "../../../pages/home/WatchlistChart";

const { chartData, defaultChartData } = vi.hoisted(() => {
  const defaultChartData = {
    spark: {
      result: [
        {
          response: [
            {
              meta: {
                previousClose: 100,
                currentTradingPeriod: {
                  regular: { start: 1, end: 301 },
                },
              },
              timestamp: [1],
              indicators: { quote: [{ close: [100] }] },
            },
          ],
        },
      ],
    },
  };

  return {
    defaultChartData,
    chartData: structuredClone(defaultChartData),
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isError: false, data: chartData }),
}));

vi.mock("@mui/material/styles", () => ({
  useTheme: () => ({
    deltaColor: { up: { color: "green" }, down: { color: "red" } },
    chartGreyLine: { color: "gray" },
  }),
}));

const getChartSvg = (container: HTMLElement) =>
  container.querySelector("[role='img']");

describe("WatchlistChart d3 rendering", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    Object.assign(chartData, structuredClone(defaultChartData));
  });

  it("renders the price line and the previous-close reference line", () => {
    const { container } = render(<WatchlistChart stockId="00001.HK" />);

    expect(getChartSvg(container)).not.toBeNull();
    expect(
      container.querySelectorAll("[data-testid='d3-line-dataset']"),
    ).toHaveLength(2);
  });

  // fix: Watchlist chart overflows in view mode
  it("lays the chart svg out as a block to avoid inline baseline overflow", () => {
    const { container } = render(<WatchlistChart stockId="00001.HK" />);

    expect(getComputedStyle(getChartSvg(container)!).display).toBe("block");
  });

  it("shows the price in a tooltip on pointer move", () => {
    const { container } = render(<WatchlistChart stockId="00001.HK" />);

    fireEvent.pointerMove(getChartSvg(container)!, {
      clientX: 48,
      clientY: 20,
    });

    expect(screen.getByTestId("d3-chart-tooltip").textContent).toContain(
      `${dayjs.unix(1).format("HHmm")}: 100.00`,
    );
  });

  it("does not show an empty tooltip over the untraded remainder of the session", () => {
    const response = chartData.spark.result[0].response[0];
    response.meta.currentTradingPeriod.regular = { start: 0, end: 1800 };
    response.timestamp = [0, 300];
    response.indicators.quote[0].close = [100, 101];

    const { container } = render(<WatchlistChart stockId="00001.HK" />);

    fireEvent.pointerMove(getChartSvg(container)!, {
      clientX: 492,
      clientY: 20,
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });

  it("dismisses the tooltip after a touch sequence ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    const { container } = render(<WatchlistChart stockId="00001.HK" />);

    const svg = getChartSvg(container)!;
    fireEvent.touchStart(svg, { touches: [{ clientX: 48, clientY: 20 }] });
    expect(screen.getByTestId("d3-chart-tooltip")).toBeTruthy();

    fireEvent.touchEnd(svg);
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });
});
