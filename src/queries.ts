import { gql, request } from "graphql-request";
import { Metrics, MorphoBlueData, TimePeriod } from "./types";
import { formatAnalytics } from "./utils";

const MORPHO_API_URL = "https://blue-api.morpho.org/graphql";
const MORPHO_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

const metricsQuery = gql`
  query GetMetrics($startTimestamp: Int!, $endTimestamp: Int!) {
    morphoBlueByAddress(address: "${MORPHO_ADDRESS}", chainId: 1) {
      state {
        totalCollateralUsd
        totalSupplyUsd
        totalBorrowUsd
        timestamp
      }
      historicalState {
        totalCollateralUsd(
          options: { 
            interval: WEEK,
            startTimestamp: $startTimestamp,
            endTimestamp: $endTimestamp
          }
        ) {
          x
          y
        }
        totalSupplyUsd(
          options: { 
            interval: WEEK,
            startTimestamp: $startTimestamp,
            endTimestamp: $endTimestamp
          }
        ) {
          x
          y
        }
        totalBorrowUsd(
          options: { 
            interval: WEEK,
            startTimestamp: $startTimestamp,
            endTimestamp: $endTimestamp
          }
        ) {
          x
          y
        }
      }
    }
  }
`;

async function getMetrics(
  period: TimePeriod = TimePeriod.WEEKLY
): Promise<Metrics> {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - period * 24 * 60 * 60;

  const { morphoBlueByAddress } = await request<{
    morphoBlueByAddress: MorphoBlueData;
  }>(MORPHO_API_URL, metricsQuery, {
    startTimestamp: startTime,
    endTimestamp: now,
  });

  return {
    morphoBlueByAddress,
  };
}

export async function getMorphoAnalytics(
  period: TimePeriod = TimePeriod.WEEKLY
): Promise<string> {
  const data = await getMetrics(period);
  return formatAnalytics(data, period);
}
