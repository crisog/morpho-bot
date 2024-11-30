import cron from "node-cron";
import { XAuthServer } from "./server";
import { XClient } from "./client";
import { XConfig, XTokens } from "./types";

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
  console.log("running a task every 1 minute");
  await xClient.tweet("gmorpho");
});

tweetTask.start();
