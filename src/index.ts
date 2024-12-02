import cron from "node-cron";
import { XAuthServer } from "./x/server";
import { XClient } from "./x/client";
import { XConfig, XTokens } from "./x/types";
import { getMorphoAnalytics } from "./queries";
import { TimePeriod } from "./types";

const config: XConfig = {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
};

const xClient = new XClient(config);

const authServer = new XAuthServer(config, (tokens: XTokens) => {
  xClient.setTokens(tokens);
});

authServer.start();

// Run every day at 10:00 AM UTC
const dailyTweetTask = cron.schedule("0 10 * * *", async () => {
  const analytics = await getMorphoAnalytics(TimePeriod.DAILY);
  await xClient.tweet(analytics);
});

dailyTweetTask.start();

// Run every Monday at 10:00 AM UTC
const weeklyTweetTask = cron.schedule("0 10 * * 1", async () => {
  const analytics = await getMorphoAnalytics(TimePeriod.WEEKLY);
  await xClient.tweet(analytics);
});

weeklyTweetTask.start();

// Run every 1st day of the month at 10:00 AM UTC
const monthlyTweetTask = cron.schedule("0 10 1 * *", async () => {
  const analytics = await getMorphoAnalytics(TimePeriod.MONTHLY);
  await xClient.tweet(analytics);
});

monthlyTweetTask.start();
