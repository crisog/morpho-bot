interface DataPoint {
  x: number;
  y: number;
}

interface MorphoBlueState {
  totalCollateralUsd: number;
  totalBorrowUsd: number;
  totalSupplyUsd: number;
  timestamp: string;
}

interface MorphoBlueHistoricalState {
  totalCollateralUsd: DataPoint[];
  totalBorrowUsd: DataPoint[];
  totalSupplyUsd: DataPoint[];
}

interface Chain {
  id: number;
}

export interface MorphoBlueData {
  chain: Chain;
  state: MorphoBlueState;
  historicalState: MorphoBlueHistoricalState;
}

export interface Metrics {
  morphoBlues: MorphoBlueData[];
}

export enum TimePeriod {
  DAILY = 1,
  WEEKLY = 7,
  MONTHLY = 30,
}
