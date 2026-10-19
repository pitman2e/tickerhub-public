import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioSummaryPieChart } from "../../../pages/portfolio-overview/PortfolioSummaryPieChart";

const { pieData } = vi.hoisted(() => ({
  pieData: {
    labels: ["AAPL", "MSFT"],
    datasets: [
      {
        data: [60, 40],
        currency: "HKD",
        customBackgroundColor: ["red", "blue"],
      },
    ],
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: pieData,
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
      palette: { text: { primary: "black" } },
    }),
  };
});

const getSlices = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-doughnut-slices'] path"),
  );

describe("PortfolioSummaryPieChart d3 rendering", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders a slice and legend entry per label", () => {
    const { container } = render(
      <PortfolioSummaryPieChart portfolioId="IB-HKD" />,
    );

    expect(getSlices(container)).toHaveLength(2);
    expect(screen.getByText("AAPL")).toBeTruthy();
    expect(screen.getByText("MSFT")).toBeTruthy();
  });

  it("shows the label, currency, value and percentage in a tooltip", () => {
    const { container } = render(
      <PortfolioSummaryPieChart portfolioId="IB-HKD" />,
    );

    fireEvent.mouseEnter(getSlices(container)[0]);

    const tooltip = screen.getByTestId("d3-chart-tooltip").textContent ?? "";
    expect(tooltip).toContain("AAPL");
    expect(tooltip).toContain("HKD 60.00");
    expect(tooltip).toContain("60.00%");
  });

  it("toggles a slice off when its legend entry is clicked", () => {
    const { container } = render(
      <PortfolioSummaryPieChart portfolioId="IB-HKD" />,
    );

    fireEvent.click(screen.getByText("AAPL"));
    expect(getSlices(container)).toHaveLength(1);

    fireEvent.click(screen.getByText("AAPL"));
    expect(getSlices(container)).toHaveLength(2);
  });

  it("dismisses the tooltip after a touch sequence ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    const { container } = render(
      <PortfolioSummaryPieChart portfolioId="IB-HKD" />,
    );

    const slice = getSlices(container)[0];
    fireEvent.touchStart(slice, { touches: [{ clientX: 100, clientY: 100 }] });
    expect(screen.getByTestId("d3-chart-tooltip")).toBeTruthy();

    fireEvent.touchEnd(slice);
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.queryByTestId("d3-chart-tooltip")).toBeNull();
  });
});
