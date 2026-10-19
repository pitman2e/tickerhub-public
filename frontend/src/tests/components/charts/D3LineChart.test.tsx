import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { D3LineChart } from "../../../components/charts/D3LineChart";

const tooltip = { format: () => "" };

const getXAxisLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-chart-x-axis'] text"),
  );

const getYAxisLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-chart-y-axis'] text"),
  ).map((label) => label.textContent);

const getYAxisTicks = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-chart-y-axis'] text"),
  );

describe("D3LineChart x axis label rotation", () => {
  afterEach(cleanup);

  it("keeps short labels horizontal", () => {
    const { container } = render(
      <D3LineChart
        labels={["Mon", "Tue", "Wed", "Thu"]}
        datasets={[{ data: [1, 2, 3, 4] }]}
        tooltip={tooltip}
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
      <D3LineChart
        labels={["2024-01-01", "2024-02-01", "2024-03-01"]}
        datasets={[{ data: [1, 2, 3] }]}
        tooltip={tooltip}
      />,
    );

    const labels = getXAxisLabels(container);
    expect(labels).not.toHaveLength(0);
    for (const label of labels) {
      expect(label.getAttribute("transform")).toContain("rotate(-45)");
      expect(label.getAttribute("text-anchor")).toBe("end");
    }
  });

  it("angles labels that become long after xTickFormat", () => {
    const { container } = render(
      <D3LineChart
        labels={["1", "2", "3"]}
        datasets={[{ data: [1, 2, 3] }]}
        tooltip={tooltip}
        xTickFormat={(label) => `Day ${label} 2024`}
      />,
    );

    const labels = getXAxisLabels(container);
    expect(labels).not.toHaveLength(0);
    for (const label of labels) {
      expect(label.getAttribute("transform")).toContain("rotate(-45)");
    }
  });

  it("packs roughly twice as many ticks on the x axis", () => {
    const values = Array.from({ length: 40 }, (_, index) => index);
    const { container } = render(
      <D3LineChart
        labels={values.map((value) => `D${value}`)}
        datasets={[{ data: values }]}
        tooltip={tooltip}
      />,
    );

    // A single non-overlapping row of labels fits about 7 ticks here.
    expect(getXAxisLabels(container).length).toBeGreaterThanOrEqual(12);
  });

  it("does not force the final label onto the axis", () => {
    // 41 labels with a step of 3 leaves the last index out of the tick grid.
    const values = Array.from({ length: 41 }, (_, index) => index);
    const { container } = render(
      <D3LineChart
        labels={values.map((value) => `D${value}`)}
        datasets={[{ data: values }]}
        tooltip={tooltip}
      />,
    );

    const labels = getXAxisLabels(container).map(
      (label) => label.textContent,
    );
    expect(labels.at(-1)).not.toBe("D40");
  });

  it("shortens y axis labels of a million or more with a K suffix", () => {
    const { container } = render(
      <D3LineChart
        labels={["A", "B"]}
        datasets={[{ data: [1_000_000, 2_000_000] }]}
        tooltip={tooltip}
        yAxis={{ tickValues: [1_000_000, 1_500_000, 2_000_000] }}
      />,
    );

    expect(getYAxisLabels(container)).toEqual([
      "1000K",
      "1500K",
      "2000K",
    ]);
  });

  it("applies the configured opacity per y axis tick", () => {
    const { container } = render(
      <D3LineChart
        labels={["A", "B"]}
        datasets={[{ data: [1, 3] }]}
        tooltip={tooltip}
        yAxis={{
          tickValues: [1, 2, 3],
          tickOpacity: (value) => (value === 2 ? 1 : 0.5),
        }}
      />,
    );

    expect(
      getYAxisTicks(container).map((tick) => tick.getAttribute("opacity")),
    ).toEqual(["0.5", "1", "0.5"]);
  });

  it("hides configured y axis gridlines without hiding their labels", () => {
    const { container } = render(
      <D3LineChart
        labels={["A", "B"]}
        datasets={[{ data: [1, 3] }]}
        tooltip={tooltip}
        yAxis={{
          tickValues: [1, 2, 3],
          gridOpacity: (value) => (value === 1 || value === 3 ? 0 : 1),
        }}
      />,
    );

    expect(getYAxisLabels(container)).toEqual(["1", "2", "3"]);
    expect(
      Array.from(
        container.querySelectorAll("[data-testid='d3-chart-y-axis'] line"),
      ).map((line) => line.getAttribute("opacity")),
    ).toEqual(["0", "1", "0"]);
  });
});
