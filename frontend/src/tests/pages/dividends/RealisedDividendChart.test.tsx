import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RealisedDividendChart from "../../../pages/dividends/RealisedDividendChart";

const { chartData } = vi.hoisted(() => ({
  chartData: {
    labels: ["2026-01", "2026-02"],
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

const renderOpenChart = () => {
  const result = render(<RealisedDividendChart stockId="00001.HK" />);
  fireEvent.click(screen.getByText("Realised Dividends Summary"));
  return result;
};

const getChartSvg = (container: HTMLElement) =>
  container.querySelector("[role='img']");

describe("RealisedDividendChart d3 rendering", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders a bar per monthly value", () => {
    const { container } = renderOpenChart();

    expect(getChartSvg(container)).not.toBeNull();
    expect(
      container.querySelectorAll("[data-testid='d3-bar-bars'] rect"),
    ).toHaveLength(2);
  });

  it("shows the currency and value in a tooltip on pointer move", () => {
    const { container } = renderOpenChart();

    fireEvent.pointerMove(getChartSvg(container)!, {
      clientX: 492,
      clientY: 40,
    });

    expect(screen.getByTestId("d3-chart-tooltip").textContent).toContain(
      "HKD 1.00",
    );
  });

  it("dismisses the tooltip after a touch sequence ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    const { container } = renderOpenChart();

    const svg = getChartSvg(container)!;
    fireEvent.touchStart(svg, { touches: [{ clientX: 492, clientY: 40 }] });
    expect(screen.getByTestId("d3-chart-tooltip")).toBeTruthy();

    fireEvent.touchEnd(svg);
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });
});
