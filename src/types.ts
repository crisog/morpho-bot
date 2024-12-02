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

export interface MorphoBlueData {
  state: MorphoBlueState;
  historicalState: MorphoBlueHistoricalState;
}

export interface Metrics {
  morphoBlueByAddress: MorphoBlueData;
}

export enum TimePeriod {
  DAILY = 1,
  WEEKLY = 7,
  MONTHLY = 30,
}
