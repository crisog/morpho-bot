import { Metrics } from "./types";

export function calculateMetrics(data: Metrics) {
  const current = {
    totalSupply: data.morphoBlueByAddress.state.totalSupplyUsd,
    totalCollateral: data.morphoBlueByAddress.state.totalCollateralUsd,
    totalBorrow: data.morphoBlueByAddress.state.totalBorrowUsd,
  };

  const currentMetrics = {
    tvlExclBorrows:
      current.totalSupply + (current.totalCollateral - current.totalBorrow),
    tvlInclBorrows: current.totalCollateral + current.totalSupply,
    borrowed: current.totalBorrow,
  };

  const historical = {
    totalSupply:
      data.morphoBlueByAddress.historicalState.totalSupplyUsd[0]?.y ?? 0,
    totalCollateral:
      data.morphoBlueByAddress.historicalState.totalCollateralUsd[0]?.y ?? 0,
    totalBorrow:
      data.morphoBlueByAddress.historicalState.totalBorrowUsd[0]?.y ?? 0,
  };

  const lastWeekMetrics = {
    tvlExclBorrows:
      historical.totalSupply +
      (historical.totalCollateral - historical.totalBorrow),
    tvlInclBorrows: historical.totalCollateral + historical.totalSupply,
    borrowed: historical.totalBorrow,
  };

  return {
    current: currentMetrics,
    lastWeek: lastWeekMetrics,
  };
}

export function calculateChanges(
  current: number,
  previous: number
): {
  direction: "up" | "down";
  percentage: number;
} {
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change >= 0 ? "up" : "down",
    percentage: Math.abs(change),
  };
}

export function formatAnalytics(data: Metrics): string {
  const metrics = calculateMetrics(data);

  const tvlInclBorrowsChange = calculateChanges(
    metrics.current.tvlInclBorrows,
    metrics.lastWeek.tvlInclBorrows
  );

  const tvlExclBorrowsChange = calculateChanges(
    metrics.current.tvlExclBorrows,
    metrics.lastWeek.tvlExclBorrows
  );

  const borrowedChange = calculateChanges(
    metrics.current.borrowed,
    metrics.lastWeek.borrowed
  );

  const utilization =
    (metrics.current.borrowed / metrics.current.tvlExclBorrows) * 100;

  const dateRange = `${formatDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )} - ${formatDate(new Date())}`;

  return `*Morpho Analytics*: ${dateRange}
  
Summary:
- TVL (incl. borrows) ${
    tvlInclBorrowsChange.direction
  } ${tvlInclBorrowsChange.percentage.toFixed(2)}% to ${formatValue(
    metrics.current.tvlInclBorrows
  )}.
- TVL (excl. borrows) ${
    tvlExclBorrowsChange.direction
  } ${tvlExclBorrowsChange.percentage.toFixed(2)}% to ${formatValue(
    metrics.current.tvlExclBorrows
  )}.
- Total borrowed ${
    borrowedChange.direction === "up" ? "increased" : "decreased"
  } ${borrowedChange.percentage.toFixed(1)}% to ${formatValue(
    metrics.current.borrowed
  )}.
- Average utilization rate at ${utilization.toFixed(1)}%.`;
}

export function formatValue(value: number): string {
  return value >= 999.99e6
    ? `$${(value / 1e9).toFixed(1)}B`
    : `$${(value / 1e6).toFixed(1)}M`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
