import React, { ComponentProps, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import StockIdAutocomplete from "../../components/StockIdAutocomplete";
import { useParams, useNavigate } from "react-router-dom";
import * as utils from "../../utils/utils";
import { getTickerOverviewPath } from "../../routes";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import {
  DefaultHeader,
  DefaultPaper,
  DefaultContainer,
  DefaultLinearProgress,
  DefaultErrorPlaceholder,
} from "../../components/DefaultComponents";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import StockDividendTable from "./StockDividendTable";
import TickerPerformance from "./TickerPerformance";
import StocksTable from "./StocksTable";
import TickerInfo from "./TickerInfo";

import AssetClassSelect from "../../components/AssetClassSelect";
import repoStockPrice from "../../repo/repoStockPrice";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";
import { useTheme } from "@mui/material/styles";
import { D3LineChart } from "../../components/charts/D3LineChart";

export function MStockOverview() {
  const navigate = useNavigate();
  const { portfolioId, stockId } = useParams();
  const [dateBack, setDateBack] = useState(6);
  const [assetClasses, setAssetClasses] = useState(["STOCK"]);
  const theme = useTheme();

  React.useEffect(() => {
    document.title = utils.getDocumentTitle("Ticker Overview");
  }, []);

  const now = dayjs();
  const toDate = now.clone().startOf("day").unix();
  const fmDate = now.clone().startOf("day").add(-dateBack, "M").unix();

  const queryKeys = {
    stockId: stockId,
    fmDate: fmDate,
    toDate: toDate,
    assetClasses: assetClasses.join(","),
  };

  const { data: dataChart, isFetching } = useQuery({
    ...ApiRequestAdapter.queryOptions(repoStockPrice.GetStockPricesChart(queryKeys)),
    enabled: Boolean(stockId),
  });

  const handleAutoCompleteOnChange: ComponentProps<
    typeof StockIdAutocomplete
  >["onChange"] = (_, value) => {
    if (value != null) {
      navigate(getTickerOverviewPath(value.stockId));
    } else {
      navigate(getTickerOverviewPath());
    }
  };

  return (
    <ErrorBoundary fallback={<DefaultErrorPlaceholder />}>
      <DefaultContainer key={(portfolioId ?? "") + (stockId ?? "")}>
        <DefaultHeader title="Ticker Overview" />

        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }}>
            <DefaultPaper>
              <Typography variant="h6" gutterBottom>
                Filtering
              </Typography>

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <StockIdAutocomplete
                    key={stockId}
                    portfolioId={portfolioId}
                    stockId={stockId}
                    isOpenPosOnly={true}
                    onChange={handleAutoCompleteOnChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <AssetClassSelect
                    onChange={(stringifiedValue) =>
                      setAssetClasses(stringifiedValue)
                    }
                    defaultValues={assetClasses}
                  />
                </Grid>
              </Grid>
            </DefaultPaper>
          </Grid>

          {(stockId ?? "") !== "" && (
            <Grid
              container
              size={{ xs: 12, sm: 4 }}
              sx={{ alignContent: "start" }}
            >
              <Grid size={{ xs: 12 }}>
                <TickerInfo stockId={stockId} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TickerPerformance stockId={stockId} />
              </Grid>
            </Grid>
          )}

          {(stockId ?? "") !== "" && (
            <Grid size={{ xs: 12, sm: 8 }}>
              {isFetching && <DefaultLinearProgress />}
              <DefaultPaper>
                <Typography variant="h6" gutterBottom>
                  Stock Price
                </Typography>

                <ButtonGroup
                  variant="outlined"
                  aria-label="outlined button group"
                >
                  <Button
                    disabled={dateBack === 3}
                    onClick={() => setDateBack(3)}
                  >
                    3-Month
                  </Button>
                  <Button
                    disabled={dateBack === 6}
                    onClick={() => setDateBack(6)}
                  >
                    6-Month
                  </Button>
                  <Button
                    disabled={dateBack === 12}
                    onClick={() => setDateBack(12)}
                  >
                    1-Year
                  </Button>
                  <Button
                    disabled={dateBack === 36}
                    onClick={() => setDateBack(36)}
                  >
                    3-Year
                  </Button>
                </ButtonGroup>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    aspectRatio: "1024/521",
                  }}
                >
                  {dataChart !== undefined && (
                    <D3LineChart
                      labels={dataChart.labels ?? []}
                      datasets={dataChart.stockPriceDatasets ?? []}
                      textColor={theme.palette.text.primary}
                      tooltip={{
                        format: ({ value }) =>
                          value === null ? "" : value.toFixed(2),
                      }}
                    />
                  )}
                </Box>
              </DefaultPaper>
            </Grid>
          )}

          {(stockId ?? "") === "" && (
            <Grid size={{ xs: 12 }}>
              <StocksTable
                key={assetClasses.join("|")}
                assetClasses={assetClasses}
              />
            </Grid>
          )}

          {(stockId ?? "") !== "" && (
            <Grid size={{ xs: 12 }}>
              <StockDividendTable
                key={(stockId ?? "") + "|" + (portfolioId ?? "")}
                portfolioId={portfolioId}
                stockId={stockId}
              />
            </Grid>
          )}
        </Grid>
      </DefaultContainer>
    </ErrorBoundary>
  );
}
