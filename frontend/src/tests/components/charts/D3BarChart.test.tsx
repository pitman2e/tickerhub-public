import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { D3BarChart } from "../../../components/charts/D3BarChart";

const getXAxisLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-chart-x-axis'] text"),
  );

const getYAxisLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-chart-y-axis'] text"),
  ).map((label) => label.textContent);

describe("D3BarChart x axis labels", () => {
  afterEach(cleanup);

  it("keeps short labels horizontal", () => {
    const { container } = render(
      <D3BarChart
        labels={["Mon", "Tue", "Wed", "Thu"]}
        datasets={[{ data: [1, 2, 3, 4] }]}
      />,
    );

    const labels = getXAxisLabels(container);
    expect(labels).not.toHaveLength(0);
    for (const label of labels) {
      expect(label.getAttribute("transform")).toBeNull();
      expect(label.getAttribute("text-anchor")).toBe("middle");
    }
  });

  it("angles long labels so more text fits", () => {
    const { container } = render(
      <D3BarChart
        labels={["2024-01-01", "2024-02-01", "2024-03-01"]}
        datasets={[{ data: [1, 2, 3] }]}
      />,
    );

    const labels = getXAxisLabels(container);
    expect(labels).not.toHaveLength(0);
    for (const label of labels) {
      expect(label.getAttribute("transform")).toContain("rotate(-45)");
      expect(label.getAttribute("text-anchor")).toBe("end");
    }
  });

  it("does not force the final label onto the axis", () => {
    // 41 labels with a step of 3 leaves the last index out of the tick grid.
    const values = Array.from({ length: 41 }, (_, index) => index);
    const { container } = render(
      <D3BarChart
        labels={values.map((value) => `D${value}`)}
        datasets={[{ data: values }]}
      />,
    );

    const labels = getXAxisLabels(container).map(
      (label) => label.textContent,
    );
    expect(labels.at(-1)).not.toBe("D40");
  });

  it("shortens y axis labels of a million or more with a K suffix", () => {
    const { container } = render(
      <D3BarChart
        labels={["A", "B"]}
        datasets={[{ data: [1_000_000, 2_000_000] }]}
        yAxis={{ tickValues: [1_000_000, 1_500_000, 2_000_000] }}
      />,
    );

    expect(getYAxisLabels(container)).toEqual([
      "1000K",
      "1500K",
      "2000K",
    ]);
  });

  it("includes the x label in each tooltip row", () => {
    const { container, getByTestId } = render(
      <D3BarChart
        labels={["A", "B"]}
        datasets={[{ data: [1, 2] }]}
        tooltip={{ format: ({ value }) => value?.toString() ?? "" }}
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    fireEvent.pointerMove(svg as SVGSVGElement, { clientX: 0, clientY: 0 });

    expect(getByTestId("d3-chart-tooltip").textContent).toBe("A: 1");
  });
});
