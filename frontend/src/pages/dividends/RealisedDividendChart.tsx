import { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  DefaultErrorPlaceholder,
  DefaultLinearProgress,
  DefaultPaper,
} from "../../components/DefaultComponents";
import { useQuery } from "@tanstack/react-query";
import repoRealisedDividend from "../../repo/repoRealisedDividend";
import { Box } from "@mui/material";
import { D3BarChart } from "../../components/charts/D3BarChart";
import { CircularProgress } from "@mui/material";
import { ListItemButton } from "@mui/material";
import { ListItemText, Collapse } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";

interface IRealisedDividendChartProps {
  portfolioId?: string;
  stockId: string;
}

export default function RealisedDividendChart({
  portfolioId,
  stockId,
}: IRealisedDividendChartProps) {
  const [open, setOpen] = useState(false);

  const queryKeys = {
    portfolioId: portfolioId,
    stockId: stockId,
  };

  const theme = useTheme();

  const { isError, data, isFetching, isSuccess } = useQuery({
    ...ApiRequestAdapter.queryOptions(repoRealisedDividend.GetMonthlyChart(queryKeys)),
  });

  if (isError)
    return (
      <DefaultPaper>
        <DefaultErrorPlaceholder />
      </DefaultPaper>
    );

  const labels = data?.labels ?? [];

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        {isFetching && <DefaultLinearProgress />}

        <DefaultPaper>
          <ListItemButton onClick={() => setOpen((prevOpen) => !prevOpen)}>
            <ListItemText>
              <Typography variant="h6">Realised Dividends Summary</Typography>
            </ListItemText>
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                aspectRatio: "500/250",
              }}
            >
              {isSuccess && (
                <D3BarChart
                  labels={labels}
                  datasets={data?.dailyRealisedDividendDatasets ?? []}
                  defaultColor={theme.palette.primary.main}
                  textColor={theme.palette.text.primary}
                  tooltip={{
                    format: ({ dataset, value }) =>
                      value === null
                        ? ""
                        : ` ${dataset.currency} ${value.toFixed(2)}`,
                  }}
                />
              )}
              {!isSuccess && <CircularProgress />}
            </Box>
          </Collapse>
        </DefaultPaper>
      </Grid>
    </Grid>
  );
}
