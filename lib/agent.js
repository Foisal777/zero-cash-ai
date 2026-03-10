require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { buildMarketContext, getTrendingCoins } = require("./market");

let telegramBot = null;
function getBot() {
  if (!telegramBot && process.env.TELEGRAM_BOT_TOKEN) {
    telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return telegramBot;
}

async function runAgent() {
  console.log("🤖 Zero Cash Ai running...");
  const ctx = await buildMarketContext();
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!channel) { console.log("No channel set"); return ctx; }

  const bot = getBot();
  if (!bot) { console.log("No bot token"); return ctx; }

  const msg = `🤖 *Zero Cash Ai — Market Update*\n\n` +
    `📊 ${ctx.summary}\n\n` +
    `💰 *Prices:*\n${ctx.prices}\n\n` +
    `${ctx.trending}\n\n` +
    `_${new Date().toUTCString()}_`;

  await bot.sendMessage(channel, msg, { parse_mode: "Markdown" });
  console.log("✅ Posted to Telegram!");
  return ctx;
}

module.exports = { runAgent };
