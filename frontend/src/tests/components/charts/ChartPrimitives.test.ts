import { describe, expect, it } from "vitest";
import { getSpreadLabelPositions } from "../../../components/charts/ChartPrimitives";

describe("getSpreadLabelPositions", () => {
  it("leaves labels that are already far apart untouched", () => {
    expect(getSpreadLabelPositions([0, 20, 40], 9, 44)).toEqual([0, 20, 40]);
  });

  it("spreads labels that overlap near the top", () => {
    expect(getSpreadLabelPositions([0, 2, 40], 9, 44)).toEqual([0, 11, 40]);
  });

  it("spreads labels that overlap near the bottom without leaving the chart", () => {
    expect(getSpreadLabelPositions([0, 42, 44], 9, 44)).toEqual([0, 33, 44]);
  });

  it("spreads a cluster around its centre", () => {
    expect(getSpreadLabelPositions([10, 12, 14], 9, 44)).toEqual([1, 12, 23]);
  });
});
