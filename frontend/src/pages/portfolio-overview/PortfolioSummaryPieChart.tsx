import React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import {
  DefaultErrorPlaceholder,
  DefaultPaper,
  DefaultLinearProgress,
} from "../../components/DefaultComponents";
import { useQuery } from "@tanstack/react-query";
import {
  CircularProgress,
  Container,
  Paper,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { D3DoughnutChart } from "../../components/charts/D3DoughnutChart";
import { MTags } from "./MTags";
import repoTags from "../../repo/repoTags";
import ApiRequestAdapter from "../../adapters/apiRequestAdapter";

interface IPortfolioSummaryPieChartProps {
  portfolioId?: string;
}

export function PortfolioSummaryPieChart({
  portfolioId,
}: IPortfolioSummaryPieChartProps) {
  const [dataFilter, setDataFilter] = React.useState({
    tag: "",
    assetClass: "",
  });
  const [dialogStateTag, setDialogStateTag] = React.useState<{
    isOpen: boolean;
    content: string;
  }>({ isOpen: false, content: "" });
  const theme = useTheme();
  const { data, isFetching, isSuccess, isError } = useQuery(
    ApiRequestAdapter.queryOptions(repoTags.GetPortfolioPie({ portfolioId, ...dataFilter })),
  );

  const dataset = data?.datasets?.[0];

  if (isError) {
    return (
      <DefaultPaper>
        <DefaultErrorPlaceholder />
      </DefaultPaper>
    );
  }

  return (
    <>
      {isFetching && <DefaultLinearProgress />}
      <Paper sx={{ padding: 2, height: "100%" }}>
        <Grid container>
          <Grid size="grow">
            <Typography variant="h6" gutterBottom>
              Asset Allocation
            </Typography>
          </Grid>

          <IconButton
            disabled={!dataFilter.tag}
            onClick={() =>
              setDialogStateTag({ isOpen: true, content: dataFilter.tag })
            }
            size="small"
            aria-label="edit"
          >
            <EditIcon />
          </IconButton>
        </Grid>

        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="select-tag-label">Tag</InputLabel>
          <Select
            labelId="select-tag"
            id="select-tag"
            label="Tag"
            value={dataFilter.tag}
            onChange={(event) => {
              setDataFilter({ ...dataFilter, tag: event.target.value });
            }}
          >
            <MenuItem value="">-</MenuItem>
            <MenuItem value={"COUNTRY"}>Country</MenuItem>
            <MenuItem value={"SECTOR"}>Sector</MenuItem>
            <MenuItem value={"HOLDING"}>Holding</MenuItem>
            <MenuItem value={"CLASS"}>Class</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="select-class-label">Class</InputLabel>
          <Select
            labelId="select-class"
            id="select-class"
            label="Class"
            value={dataFilter.assetClass}
            onChange={(event) => {
              setDataFilter({ ...dataFilter, assetClass: event.target.value });
            }}
          >
            <MenuItem value="">-</MenuItem>
            <MenuItem value={"STOCK"}>Stock</MenuItem>
            <MenuItem value={"BOND"}>Bond</MenuItem>
            <MenuItem value={"MANUAL"}>Manual</MenuItem>
          </Select>
        </FormControl>

        <Container
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            aspectRatio: "1040/346",
          }}
        >
          {isSuccess && (
            <D3DoughnutChart
              labels={data?.labels ?? []}
              data={dataset?.data ?? []}
              colors={dataset?.customBackgroundColor}
              currency={dataset?.currency}
              legendColor={theme.palette.text.primary}
            />
          )}
          {!isSuccess && <CircularProgress />}
        </Container>
      </Paper>
      {dialogStateTag.isOpen && (
        <MTags
          category={dialogStateTag.content}
          onDialogClose={() =>
            setDialogStateTag({ isOpen: false, content: "" })
          }
        />
      )}
    </>
  );
}
