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

export interface XTokens {
  accessToken: string;
  refreshToken: string;
}

export interface XConfig {
  clientId: string;
  clientSecret: string;
}

export interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token: string;
}
