import { Metrics, TimePeriod } from "./types";

export function calculateMetrics(data: Metrics) {
  const current = data.morphoBlues.reduce(
    (acc, morphoBlue) => ({
      totalSupply: acc.totalSupply + (morphoBlue.state.totalSupplyUsd || 0),
      totalCollateral:
        acc.totalCollateral + (morphoBlue.state.totalCollateralUsd || 0),
      totalBorrow: acc.totalBorrow + (morphoBlue.state.totalBorrowUsd || 0),
    }),
    { totalSupply: 0, totalCollateral: 0, totalBorrow: 0 }
  );

  const currentMetrics = {
    tvlExclBorrows:
      current.totalSupply + (current.totalCollateral - current.totalBorrow),
    tvlInclBorrows: current.totalCollateral + current.totalSupply,
    borrowed: current.totalBorrow,
  };

  const historical = data.morphoBlues.reduce(
    (acc, morphoBlue) => ({
      totalSupply:
        acc.totalSupply +
        (morphoBlue.historicalState.totalSupplyUsd[0]?.y ?? 0),
      totalCollateral:
        acc.totalCollateral +
        (morphoBlue.historicalState.totalCollateralUsd[0]?.y ?? 0),
      totalBorrow:
        acc.totalBorrow +
        (morphoBlue.historicalState.totalBorrowUsd[0]?.y ?? 0),
    }),
    { totalSupply: 0, totalCollateral: 0, totalBorrow: 0 }
  );

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
    chains: data.morphoBlues.map((morphoBlue) => ({
      chainId: morphoBlue.chain.id,
      current: {
        tvlExclBorrows:
          morphoBlue.state.totalSupplyUsd +
          (morphoBlue.state.totalCollateralUsd -
            morphoBlue.state.totalBorrowUsd),
        tvlInclBorrows:
          morphoBlue.state.totalCollateralUsd + morphoBlue.state.totalSupplyUsd,
        borrowed: morphoBlue.state.totalBorrowUsd,
      },
      lastWeek: {
        tvlExclBorrows:
          (morphoBlue.historicalState.totalSupplyUsd[0]?.y ?? 0) +
          ((morphoBlue.historicalState.totalCollateralUsd[0]?.y ?? 0) -
            (morphoBlue.historicalState.totalBorrowUsd[0]?.y ?? 0)),
        tvlInclBorrows:
          (morphoBlue.historicalState.totalCollateralUsd[0]?.y ?? 0) +
          (morphoBlue.historicalState.totalSupplyUsd[0]?.y ?? 0),
        borrowed: morphoBlue.historicalState.totalBorrowUsd[0]?.y ?? 0,
      },
    })),
  };
}

export function calculateChanges(
  current: number,
  previous: number
): {
  direction: "up" | "down";
  percentage: number;
} {
  if (previous === 0) return { direction: "up", percentage: 0 };
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

  const currentUtilization =
    (metrics.current.borrowed / metrics.current.tvlExclBorrows) * 100;
  const historicalUtilization =
    (metrics.lastWeek.borrowed / metrics.lastWeek.tvlExclBorrows) * 100;
  const utilizationChange = calculateChanges(
    currentUtilization,
    historicalUtilization
  );

  const dateRange = `${formatDate(
    new Date(Date.now() - period * 24 * 60 * 60 * 1000)
  )} - ${formatDate(new Date())}`;

  const ethereumMetrics = metrics.chains.find(
    (chain) => chain.chainId === 1
  )?.current;
  const baseMetrics = metrics.chains.find(
    (chain) => chain.chainId === 8453
  )?.current;

  const ethereumShare = ethereumMetrics
    ? (
        (ethereumMetrics.tvlInclBorrows / metrics.current.tvlInclBorrows) *
        100
      ).toFixed(1)
    : "0";
  const baseShare = baseMetrics
    ? (
        (baseMetrics.tvlInclBorrows / metrics.current.tvlInclBorrows) *
        100
      ).toFixed(1)
    : "0";

  const formatChangeMessage = (
    change: { direction: "up" | "down"; percentage: number },
    value: string
  ) => {
    if (change.percentage === 0) return `remained at ${value}`;
    return `${
      change.direction === "up" ? "increased" : "decreased"
    } ${change.percentage.toFixed(2)}% to ${value}`;
  };

  return `${
    periodLabel.charAt(0) + periodLabel.slice(1).toLowerCase()
  } Analytics: ${dateRange}

Summary:  
- TVL ${formatChangeMessage(
    tvlInclBorrowsChange,
    formatValue(metrics.current.tvlInclBorrows)
  )}.
- TVL (excl. borrows) ${formatChangeMessage(
    tvlExclBorrowsChange,
    formatValue(metrics.current.tvlExclBorrows)
  )}.
- Borrowed ${formatChangeMessage(
    borrowedChange,
    formatValue(metrics.current.borrowed)
  )}.
- Utilization ${formatChangeMessage(
    utilizationChange,
    `${currentUtilization.toFixed(2)}%`
  )}.

Ethereum: ${ethereumShare}% | Base: ${baseShare}%`;
}

export function formatValue(value: number): string {
  return value >= 999.99e6
    ? `$${(value / 1e9).toFixed(2)}B`
    : `$${(value / 1e6).toFixed(2)}M`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
