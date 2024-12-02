import { Metrics, TimePeriod } from "./types";

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

export function formatAnalytics(data: Metrics, period: TimePeriod): string {
  const metrics = calculateMetrics(data);
  const periodLabel = TimePeriod[period];

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
    new Date(Date.now() - period * 24 * 60 * 60 * 1000)
  )} - ${formatDate(new Date())}`;

  const formatChangeMessage = (
    change: { direction: "up" | "down"; percentage: number },
    value: string
  ) => {
    if (change.percentage === 0) return `remained at ${value}`;
    return `${
      change.direction === "up" ? "increased" : "decreased"
    } ${change.percentage.toFixed(2)}% to ${value}`;
  };

  return `Morpho ${
    periodLabel.charAt(0) + periodLabel.slice(1).toLowerCase()
  } Analytics: ${dateRange}
  
Summary:
- TVL (incl. borrows) ${formatChangeMessage(
    tvlInclBorrowsChange,
    formatValue(metrics.current.tvlInclBorrows)
  )}.
- TVL (excl. borrows) ${formatChangeMessage(
    tvlExclBorrowsChange,
    formatValue(metrics.current.tvlExclBorrows)
  )}.
- Total borrowed ${formatChangeMessage(
    borrowedChange,
    formatValue(metrics.current.borrowed)
  )}.
- Average utilization rate at ${utilization.toFixed(1)}%.`;
}

export function formatValue(value: number): string {
  return value >= 999.99e6
    ? `$${(value / 1e9).toFixed(2)}B`
    : `$${(value / 1e6).toFixed(2)}M`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
