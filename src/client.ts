import got, { HTTPError } from "got";
import { TokenResponse, XConfig, XTokens } from "./types";

export class XClient {
  private readonly X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
  private readonly X_TWEET_URL = "https://api.x.com/2/tweets";

  private config: XConfig;
  private tokens: XTokens | null = null;

  constructor(config: XConfig) {
    this.config = config;
  }

  setTokens(tokens: XTokens): void {
    this.tokens = tokens;
  }

  async tweet(text: string): Promise<void> {
    if (!this.tokens) {
      throw new Error(
        "No authentication tokens available. Please authenticate first."
      );
    }

    try {
      await got
        .post(this.X_TWEET_URL, {
          json: { text },
          headers: {
            Authorization: `Bearer ${this.tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        })
        .json();
    } catch (error) {
      if (error instanceof HTTPError) {
        console.log(
          "Tweet Error Response:",
          JSON.stringify(error.response.body, null, 2)
        );

        if (error.response.statusCode === 401) {
          console.log("Token expired, attempting refresh...");
          await this.refreshToken();
          return this.tweet(text);
        }
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.tokens) {
      throw new Error("No refresh token available");
    }

    const password = `${this.config.clientId}:${this.config.clientSecret}`;

    try {
      const response: TokenResponse = await got
        .post(this.X_TOKEN_URL, {
          form: {
            refresh_token: this.tokens.refreshToken,
            grant_type: "refresh_token",
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(password).toString("base64")}`,
          },
        })
        .json();

      this.tokens = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    } catch (error) {
      if (error) {
        if (error instanceof HTTPError) {
          console.log(
            "Token Refresh Error:",
            JSON.stringify(error.response.body, null, 2)
          );
        } else {
          console.log("Token Refresh Error:", error);
        }
        throw error;
      }
    }
  }
}
