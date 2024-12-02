import Express from "express";
import got from "got";
import { XConfig, XTokens, TokenResponse } from "./types";

interface TokenState extends XTokens {
  expiresAt: number;
}

export class XAuthServer {
  private readonly X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
  private readonly X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
  private readonly CALLBACK_URL = "http://localhost:3000/callback";
  private config: XConfig;
  private tokenCallback: (tokens: XTokens) => void;
  private tokenState: TokenState | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor(config: XConfig, tokenCallback: (tokens: XTokens) => void) {
    this.config = config;
    this.tokenCallback = tokenCallback;

    if (process.env.ACCESS_TOKEN && process.env.REFRESH_TOKEN) {
      console.log("Initializing with existing tokens from environment");
      this.updateTokenState({
        access_token: process.env.ACCESS_TOKEN!,
        refresh_token: process.env.REFRESH_TOKEN!,
        expires_in: 3600,
        token_type: "Bearer",
        scope: "tweet.read tweet.write users.read offline.access",
      });
    } else {
      console.log(
        "No tokens found in environment. Waiting for authentication..."
      );
    }
  }

  private updateTokenState(response: TokenResponse): void {
    // 5 minutes buffer
    const expiresAt = Date.now() + (response.expires_in - 300) * 1000;

    this.tokenState = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
    };

    this.scheduleTokenRefresh();

    this.tokenCallback({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    });
  }

  private scheduleTokenRefresh(): void {
    if (!this.tokenState) return;

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const timeUntilRefresh = this.tokenState.expiresAt - Date.now();
    if (timeUntilRefresh <= 0) {
      this.refreshToken();
    } else {
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.tokenState?.refreshToken) {
      console.log(
        "No refresh token available. Manual authentication required."
      );
      return;
    }

    try {
      const password = `${this.config.clientId}:${this.config.clientSecret}`;
      const response: TokenResponse = await got
        .post(this.X_TOKEN_URL, {
          form: {
            refresh_token: this.tokenState.refreshToken,
            grant_type: "refresh_token",
            client_id: this.config.clientId,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(password).toString("base64")}`,
          },
        })
        .json();

      this.updateTokenState(response);
      console.log("Token refresh successful");
    } catch (error) {
      console.error("Token refresh failed.");
      this.tokenState = null;
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      console.log("Manual reauthentication required. Visit /auth endpoint.");
    }
  }

  start(): void {
    const app = Express();

    app.get("/auth", (req: Express.Request, res: Express.Response) => {
      const redirectUrl = new URL(this.X_AUTHORIZE_URL);
      redirectUrl.searchParams.append("response_type", "code");
      redirectUrl.searchParams.append("client_id", this.config.clientId);
      redirectUrl.searchParams.append("redirect_uri", this.CALLBACK_URL);
      redirectUrl.searchParams.append(
        "scope",
        "tweet.read tweet.write users.read offline.access"
      );
      redirectUrl.searchParams.append("state", "1234");
      redirectUrl.searchParams.append("code_challenge", "challenge");
      redirectUrl.searchParams.append("code_challenge_method", "plain");

      res.redirect(redirectUrl.toString());
    });

    app.get("/callback", async (req, res) => {
      try {
        const password = `${this.config.clientId}:${this.config.clientSecret}`;

        const response: TokenResponse = await got
          .post(this.X_TOKEN_URL, {
            form: {
              code: req.query.code,
              redirect_uri: this.CALLBACK_URL,
              grant_type: "authorization_code",
              code_verifier: "challenge",
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(password).toString(
                "base64"
              )}`,
            },
          })
          .json();

        this.updateTokenState(response);
        console.log("Authentication successful, tokens updated");

        res.send("Authentication successful! You can close this window.");
      } catch (error) {
        res.status(500).send("Authentication failed!");
        console.error("Error during authentication:", error);
      }
    });

    const startupMessage = this.isAuthenticated()
      ? "Server started with existing tokens"
      : "Visit http://localhost:3000/auth to authenticate";

    app.listen(3000, () => {
      console.log(startupMessage);
    });
  }

  public isAuthenticated(): boolean {
    return !!this.tokenState && this.tokenState.expiresAt > Date.now();
  }

  public async forceRefresh(): Promise<boolean> {
    if (!this.tokenState?.refreshToken) return false;
    await this.refreshToken();
    return this.isAuthenticated();
  }
}
