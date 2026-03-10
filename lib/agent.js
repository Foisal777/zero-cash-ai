require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { buildMarketContext, checkPriceAlerts } = require("./market");
const { generateAnalysis, generateAlertAnalysis } = require("./ai");
const { generateComparisonChartUrl, generateSparklineChartUrl, downloadChart } = require("./chart");

let bot = null;
function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  return bot;
}

// Channel + Group দুটোতেই post করবে
async function postToAll(b, caption, chartBuffer) {
  const targets = [
    process.env.TELEGRAM_CHANNEL_ID,
    process.env.TELEGRAM_GROUP_ID
  ].filter(Boolean);

  for (const target of targets) {
    try {
      if (chartBuffer) {
        await b.sendPhoto(target, chartBuffer, { caption, parse_mode: "Markdown" });
      } else {
        await b.sendMessage(target, caption, { parse_mode: "Markdown" });
      }
      console.log(`✅ Posted to ${target}`);
    } catch (err) {
      console.error(`❌ Failed to post to ${target}:`, err.message);
    }
  }
}

async function runHourlyUpdate() {
  const b = getBot();
  if (!b) return;
  console.log("📊 Posting hourly update...");
  const ctx = await buildMarketContext();
  const aiAnalysis = await generateAnalysis(ctx);
  const chartUrl = generateComparisonChartUrl(ctx.raw.markets);
  const chartBuffer = await downloadChart(chartUrl);
  const caption = `🤖 *Zero Cash Ai — Hourly Update*\n\n` +
    `🧠 *AI Analysis:*\n${aiAnalysis}\n\n` +
    `📊 ${ctx.summary}\n\n` +
    `💰 *Prices:*\n${ctx.prices}\n\n` +
    `${ctx.trending}\n\n` +
    `_${new Date().toUTCString()}_`;
  await postToAll(b, caption, chartBuffer);
}

async function runAlertCheck() {
  const b = getBot();
  if (!b) return;
  const ctx = await buildMarketContext();
  const { alerts, markets } = await checkPriceAlerts();
  for (const alert of alerts) {
    console.log(`⚠️ Alert: ${alert.coin} ${alert.change1h}%`);
    const analysis = await generateAlertAnalysis(alert, ctx);
    const coin = markets.find(c => c.symbol === alert.symbol);
    let chartBuffer = null;
    if (coin?.sparkline?.length > 2) {
      const chartUrl = generateSparklineChartUrl(coin);
      if (chartUrl) chartBuffer = await downloadChart(chartUrl);
    }
    const msg = `⚡ *PRICE ALERT*\n\n${alert.direction} *${alert.coin} (${alert.symbol})*\n\n` +
      `💵 Price: *$${alert.price?.toLocaleString()}*\n` +
      `📈 1h Change: *${alert.change1h > 0 ? "+" : ""}${alert.change1h}%*\n\n` +
      `🧠 *AI Insight:*\n${analysis}\n\n` +
      `_${new Date().toUTCString()}_`;
    await postToAll(b, msg, chartBuffer);
  }
}

module.exports = { runHourlyUpdate, runAlertCheck, getBot };
