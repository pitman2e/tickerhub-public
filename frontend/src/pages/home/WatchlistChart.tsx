import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { repoDlProxy } from "../../repo/repoDlProxy";
import { Box } from "@mui/system";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";
import { D3LineChart } from "../../components/charts/D3LineChart";

interface IWatchlistChartProps {
  stockId: string;
}

export default function WatchlistChart({ stockId }: IWatchlistChartProps) {
  const theme = useTheme();
  const qry = useQuery(ApiRequestAdapter.queryOptions(repoDlProxy.Get({ stockId })));

  if (qry.isError || !qry.data) {
    return <></>;
  }

  const chartData = qry.data;
  const prevClosePrice: number =
    chartData.spark.result[0].response[0].meta.previousClose;
  const curTradeTimestamps: number[] = Array.from(
    chartData.spark.result[0].response[0].timestamp,
  ); // Shadow copy of a React State before mutation
  const curTradePrices: (number | null)[] = Array.from(
    chartData.spark.result[0].response[0].indicators.quote[0].close,
  ); // Shadow copy of a React State; keep nulls aligned with timestamps
  //const tsTradeStart = qry.data.spark.result[0].response[0].meta.currentTradingPeriod.regular.start;
  const tsTradeStart: number =
    chartData.spark.result[0].response[0].meta.currentTradingPeriod.regular
      .start;
  const tsTradeEnd: number =
    chartData.spark.result[0].response[0].meta.currentTradingPeriod.regular.end;
  const secondPerTick = 5 * 60; //300
  //const totalTicksCnt = Math.floor((tsTradeEnd - tsTradeStart) / secondPerTick)

  let processingTradeTimestamp =
    curTradeTimestamps[curTradeTimestamps.length - 1];
  while (
    processingTradeTimestamp < tsTradeEnd &&
    processingTradeTimestamp >= tsTradeStart
  ) {
    processingTradeTimestamp += secondPerTick;
    curTradeTimestamps.push(processingTradeTimestamp);
    curTradePrices.push(null);
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "3em",
        width: { xs: "9em", sm: "11em", lg: "15em" },
      }}
    >
      {chartData && (
        <Box //Hacky way to expand the canvas a little bit more
          sx={{
            position: "absolute",
            top: "-0.3em",   // Shifts canvas upward
            left: 0,
            height: "3.5em",   // Expanded height (larger than parent's 3em)
            width: "100%",   // Can also be expanded (e.g., "120%")
          }}
        >
          <D3LineChart
            labels={curTradeTimestamps.map((timestamp) =>
              dayjs.unix(timestamp).format("MM-DD HH:mm"),
            )}
            datasets={[
              {
                data: curTradePrices,
                borderWidth: 1.1,
                pointRadius: 0,

                // Mouse hover legend color
                pointColor: (price) => {
                  if (price == null) {
                    return undefined;
                  }

                  return price >= prevClosePrice
                    ? theme.deltaColor.up.color
                    : theme.deltaColor.down.color;
                },

                // Line color
                segmentColor: (p0, p1) => {
                  if (p0 == null || p1 == null) {
                    return undefined;
                  }

                  return p0 >= prevClosePrice && p1 >= prevClosePrice
                    ? theme.deltaColor.up.color
                    : theme.deltaColor.down.color;
                },
              },
              {
                fill: false,
                color: theme.chartGreyLine.color,
                borderDash: [5, 5],
                borderWidth: 0.3,
                pointRadius: 0,
                data: Array(curTradeTimestamps.length).fill(prevClosePrice),
              },
            ]}
            showXAxis={false}
            yAxis={{
              min:
                Math.min(
                  ...curTradePrices.filter((price): price is number => price !== null),
                  prevClosePrice,
                ) * 0.999,
              max:
                Math.max(
                  ...curTradePrices.filter((price): price is number => price !== null),
                  prevClosePrice,
                ) * 1.001,
              tickValues: [prevClosePrice],
              tickFormat: (value) => value.toFixed(2),
              tickFontSize: 9,
            }}
            textColor={theme.chartGreyLine.color}
            tooltip={{
              includeDataset: (datasetIndex) => datasetIndex === 0,
              format: ({ value }) =>
                value === null ? "" : value.toFixed(2),
            }}
          />
        </Box>
      )}
    </Box>
  );
}
