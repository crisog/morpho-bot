import { gql, request } from "graphql-request";
import { Metrics, MorphoBlueData, TimePeriod } from "./types";
import { formatAnalytics } from "./utils";

const MORPHO_API_URL = "https://blue-api.morpho.org/graphql";

function getInterval(period: TimePeriod): string {
  switch (period) {
    case TimePeriod.DAILY:
      return "HOUR";
    case TimePeriod.WEEKLY:
      return "DAY";
    case TimePeriod.MONTHLY:
      return "WEEK";
  }
}

const metricsQuery = gql`
  query GetMetrics(
    $startTimestamp: Int!
    $endTimestamp: Int!
    $interval: TimeseriesInterval!
    $chainIds: [Int!]!
  ) {
    morphoBlues(where: { chainId_in: $chainIds }) {
      items {
        chain {
          id
        }
        state {
          totalCollateralUsd
          totalSupplyUsd
          totalBorrowUsd
          timestamp
        }
        historicalState {
          totalCollateralUsd(
            options: {
              interval: $interval
              startTimestamp: $startTimestamp
              endTimestamp: $endTimestamp
            }
          ) {
            x
            y
          }
          totalSupplyUsd(
            options: {
              interval: $interval
              startTimestamp: $startTimestamp
              endTimestamp: $endTimestamp
            }
          ) {
            x
            y
          }
          totalBorrowUsd(
            options: {
              interval: $interval
              startTimestamp: $startTimestamp
              endTimestamp: $endTimestamp
            }
          ) {
            x
            y
          }
        }
      }
    }
  }
`;

async function getMetrics(
  period: TimePeriod = TimePeriod.WEEKLY,
  chainIds: number[] = [1, 8453]
): Promise<Metrics> {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - period * 24 * 60 * 60;
  const interval = getInterval(period);

  const response = await request<{
    morphoBlues: { items: MorphoBlueData[] };
  }>(MORPHO_API_URL, metricsQuery, {
    startTimestamp: startTime,
    endTimestamp: now,
    interval,
    chainIds,
  });

  return {
    morphoBlues: response.morphoBlues.items,
  };
}

export async function getMorphoAnalytics(
  period: TimePeriod = TimePeriod.WEEKLY,
  chainIds: number[] = [1, 8453]
): Promise<string> {
  try {
    const data = await getMetrics(period, chainIds);
    return formatAnalytics(data, period);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
