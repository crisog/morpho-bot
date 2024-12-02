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
