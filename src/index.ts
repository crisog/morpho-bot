import cron from "node-cron";
import { XAuthServer } from "./server";
import { XClient } from "./client";
import { XConfig, XTokens } from "./types";
import { getMorphoAnalytics } from "./queries";

const config: XConfig = {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
};

const xClient = new XClient(config);

const authServer = new XAuthServer(config, (tokens: XTokens) => {
  xClient.setTokens(tokens);
});

authServer.start();

const tweetTask = cron.schedule("*/1 * * * *", async () => {
  const analytics = await getMorphoAnalytics();
  await xClient.tweet(analytics);
});

tweetTask.start();
