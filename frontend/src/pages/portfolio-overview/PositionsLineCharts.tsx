import { useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import {
  DefaultPaper,
  DefaultErrorPlaceholder,
  DefaultLinearProgress,
} from "../../components/DefaultComponents";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import repoPortfolio from "../../repo/repoPortfolio";
import { IChartDataset, IChartTooltipOptions } from "../../types/chart";
import { IPositionChartData } from "../../types/api";
import DateRangeSelector, {
  getPresetDates,
} from "../../components/DateRangeSelector";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";
import { D3LineChart } from "../../components/charts/D3LineChart";
import { D3BarChart } from "../../components/charts/D3BarChart";

interface IPositionsLineChartsProps {
  portfolioId?: string;
  stockId?: string;
}

export function PositionsLineCharts({
  portfolioId,
  stockId,
}: IPositionsLineChartsProps) {
  dayjs.extend(utc);
  const defaultDateRangePreset = "YTD";
  const defaultDateRange = getPresetDates(defaultDateRangePreset);
  const [dateRange, setDateRange] = useState<{
    fmDate: number;
    toDate: number;
  }>({
    fmDate: defaultDateRange.from!.unix(),
    toDate: defaultDateRange.to!.unix(),
  });
  const [dayRes, setDayRes] = useState<number>(1);
  const theme = useTheme();

  const toDate = dateRange.toDate;
  const fmDate = dateRange.fmDate;

  const queryKeys = {
    portfolioId,
    stockId,
    dayRes,
    fmDate,
    toDate,
  };

  const { isError, data, isFetching, isSuccess } = useQuery<IPositionChartData>(
    ApiRequestAdapter.queryOptions(repoPortfolio.GetPositionChart(queryKeys)),
  );

  if (isError)
    return (
      <DefaultPaper>
        <DefaultErrorPlaceholder />
      </DefaultPaper>
    );

  const labels = data?.labels ?? [];

  const tooltipOptions: IChartTooltipOptions = {
    format: ({ dataset, value }) =>
      value === null ? "" : `${dataset.currency} ${value.toFixed(2)}`,
  };

  const renderLineChart = (datasets?: IChartDataset[]) => (
    <D3LineChart
      labels={labels}
      datasets={datasets ?? []}
      pointRadius={2}
      defaultColor={theme.palette.primary.main}
      textColor={theme.palette.text.primary}
      tooltip={tooltipOptions}
    />
  );

  const renderBarChart = (datasets?: IChartDataset[]) => (
    <D3BarChart
      labels={labels}
      datasets={datasets ?? []}
      defaultColor={theme.palette.primary.main}
      textColor={theme.palette.text.primary}
      tooltip={tooltipOptions}
    />
  );

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <DefaultPaper>
          <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Typography variant="body2" gutterBottom={true}>
                Period
              </Typography>
              <DateRangeSelector
                SetStateAction={setDateRange}
                DefaultPreset={defaultDateRangePreset}
                IsNullable={false}
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Typography variant="body2" gutterBottom={true}>
                {"Resolution (" + dayRes + " Days)"}
              </Typography>
              <ButtonGroup
                sx={{ height: "56px" }}
                variant="outlined"
                aria-label="outlined button group"
              >
                <Button disabled={dayRes === 1} onClick={() => setDayRes(1)}>
                  1D
                </Button>
                <Button disabled={dayRes === 7} onClick={() => setDayRes(7)}>
                  1W
                </Button>
                <Button disabled={dayRes === 30} onClick={() => setDayRes(30)}>
                  1M
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}
        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Market Value
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderLineChart(data?.unrealisedDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Total Gain
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderLineChart(data?.totalGainDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Total Gain (Offset)
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderLineChart(data?.totalGainOffsetDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Daily Gain
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderBarChart(data?.dailyGainDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Unrealised Cost
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderLineChart(data?.unrealisedCostDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <Typography variant="h6" gutterBottom>
            Realised Dividend
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              aspectRatio: "500/250",
            }}
          >
            {isSuccess && renderBarChart(data?.dailyRealisedDividendDatasets)}

            {!isSuccess && <CircularProgress />}
          </Box>
        </DefaultPaper>
      </Grid>
    </Grid>
  );
}
