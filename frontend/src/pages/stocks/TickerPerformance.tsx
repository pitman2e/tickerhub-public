import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { DefaultLinearProgress, DefaultPaper } from "../../components/DefaultComponents";
import ImminentErrorIcon from "../../components/ImminentErrorIcon";
import * as utils from "../../utils/utils";
import { useQuery } from "@tanstack/react-query";
import repoStockPrice from "../../repo/repoStockPrice";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";
import { D3BarChart } from "../../components/charts/D3BarChart";

interface ITickerPerformanceProps {
  stockId?: string;
}

export default function TickerPerformance({ stockId }: ITickerPerformanceProps) {
  const theme = useTheme();

  const { isError, data, isFetching } = useQuery({
    ...ApiRequestAdapter.queryOptions(repoStockPrice.GetPerformance({ stockId })),
    enabled: !!stockId,
  });

  if (isError && data === undefined) return null;

  const labels = [
    "From Top",
    "1-Month",
    "3-Month",
    "YTD",
    "1-Year",
    "3-Year",
    "5-Year",
  ];

  return (
    <>
      {isFetching && <DefaultLinearProgress />}
      <DefaultPaper>
        <Typography variant="h6" gutterBottom>
          Performance {isError && <ImminentErrorIcon />}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            aspectRatio: "500/250",
          }}
        >
          {data !== undefined ? (
            <D3BarChart
              labels={labels}
              datasets={[
                {
                  label: "Performance",
                  data: [
                    data.dropFromTop,
                    data.oneMonth,
                    data.threeMonth,
                    data.ytd,
                    data.oneYear,
                    data.threeYear,
                    data.fiveYear,
                  ],
                },
              ]}
              defaultColor={theme.palette.primary.main}
              textColor={theme.palette.text.primary}
              yAxis={{ tickFormat: (value) => `${value}%` }}
              valueLabel={({ value }) =>
                value === null || value === undefined
                  ? ""
                  : utils.getFmtSgnDec(value, 2, "", "%")
              }
            />
          ) : (
            <CircularProgress />
          )}
        </Box>
      </DefaultPaper>
    </>
  );
}
