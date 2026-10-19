import { RefObject, useEffect, useRef, useState } from "react";

export interface IChartDimensions {
  width: number;
  height: number;
}

// Used before the first measurement (and in environments without layout, such
// as jsdom). Keeps the first render deterministic.
export const fallbackChartDimensions: IChartDimensions = {
  width: 500,
  height: 250,
};

// Tracks the pixel size of a container element so charts can fill it while
// keeping their text and stroke widths constant. Falls back to the provided
// defaults when ResizeObserver is unavailable.
export function useChartDimensions(
  fallback: IChartDimensions = fallbackChartDimensions,
): {
  containerRef: RefObject<HTMLDivElement | null>;
  dimensions: IChartDimensions;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<IChartDimensions>(fallback);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { containerRef, dimensions };
}
