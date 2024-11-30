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
