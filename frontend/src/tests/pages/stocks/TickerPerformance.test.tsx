import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TickerPerformance from "../../../pages/stocks/TickerPerformance";

const { perfData } = vi.hoisted(() => ({
  perfData: {
    dropFromTop: -5,
    oneMonth: 1,
    threeMonth: 2,
    ytd: 3,
    oneYear: 4,
    threeYear: 5,
    fiveYear: 6,
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: perfData,
    isFetching: false,
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

const getChartSvg = (container: HTMLElement) =>
  container.querySelector("[role='img']");

describe("TickerPerformance d3 rendering", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders a bar per performance window", () => {
    const { container } = render(<TickerPerformance stockId="00001.HK" />);

    expect(getChartSvg(container)).not.toBeNull();
    expect(
      container.querySelectorAll("[data-testid='d3-bar-bars'] rect"),
    ).toHaveLength(7);
  });

  it("renders the formatted value above each bar", () => {
    const { container } = render(<TickerPerformance stockId="00001.HK" />);

    const labels = [
      ...container.querySelectorAll(
        "[data-testid='d3-bar-value-labels'] text",
      ),
    ].map((label) => label.textContent);

    expect(labels).toEqual([
      "-5.00%",
      "+1.00%",
      "+2.00%",
      "+3.00%",
      "+4.00%",
      "+5.00%",
      "+6.00%",
    ]);
  });

  it("does not show a tooltip on pointer move", () => {
    const { container } = render(<TickerPerformance stockId="00001.HK" />);

    fireEvent.pointerMove(getChartSvg(container)!, {
      clientX: 492,
      clientY: 40,
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });
});
