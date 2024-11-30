import Express from "express";
import got from "got";
import { XConfig, XTokens, TokenResponse } from "./types";

export class XAuthServer {
  private readonly X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
  private readonly X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
  private readonly CALLBACK_URL = "http://localhost:3000/callback";
  private config: XConfig;
  private tokenCallback: (tokens: XTokens) => void;

  constructor(config: XConfig, tokenCallback: (tokens: XTokens) => void) {
    this.config = config;
    this.tokenCallback = tokenCallback;

    this.tokenCallback({
      accessToken: process.env.ACCESS_TOKEN!,
      refreshToken: process.env.REFRESH_TOKEN!,
    });
  }

  start(): void {
    const app = Express();

    app.get("/auth", (req: Express.Request, res: Express.Response) => {
      const redirectUrl = new URL(this.X_AUTHORIZE_URL);
      redirectUrl.searchParams.append("response_type", "code");
      redirectUrl.searchParams.append("client_id", this.config.clientId);
      redirectUrl.searchParams.append("redirect_uri", this.CALLBACK_URL);
      redirectUrl.searchParams.append("scope", "tweet.write");
      redirectUrl.searchParams.append("state", "1234");
      redirectUrl.searchParams.append("code_challenge", "challenge");
      redirectUrl.searchParams.append("code_challenge_method", "plain");

      res.redirect(redirectUrl.toString());
    });

    app.get("/callback", async (req, res) => {
      try {
        const password = `${this.config.clientId}:${this.config.clientSecret}`;

        const response: TokenResponse = await got
          .post<TokenResponse>(this.X_TOKEN_URL, {
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

        this.tokenCallback({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        });

        res.send("Authentication successful! You can close this window.");
      } catch (error) {
        res.status(500).send("Authentication failed!");
        console.error("Error during authentication:", error);
      }
    });

    app.listen(3000, () => {
      console.log("Visit http://localhost:3000/auth to authenticate");
    });
  }
}
