import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { D3DoughnutChart } from "../../../components/charts/D3DoughnutChart";
import colors from "../../../ui/colors";

const getSliceFills = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[data-testid='d3-doughnut-slices'] path"),
  ).map((slice) => slice.getAttribute("fill"));

describe("D3DoughnutChart slice colours", () => {
  afterEach(cleanup);

  it("falls back to the shared palette when a slice colour is an empty string", () => {
    const { container } = render(
      <D3DoughnutChart labels={["A", "B"]} data={[1, 1]} colors={["", ""]} />,
    );

    expect(getSliceFills(container)).toEqual([colors[0], colors[1]]);
  });

  it("uses the provided slice colours when present", () => {
    const { container } = render(
      <D3DoughnutChart
        labels={["A", "B"]}
        data={[1, 1]}
        colors={["red", "blue"]}
      />,
    );

    expect(getSliceFills(container)).toEqual(["red", "blue"]);
  });
});
