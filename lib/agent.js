require("dotenv").config();
const {
  GameAgent, GameWorker, GameFunction,
  ExecutableGameFunctionResponse, ExecutableGameFunctionStatus
} = require("@virtuals-protocol/game");
const TelegramBot = require("node-telegram-bot-api");
const { buildMarketContext, getTrendingCoins } = require("./market");

let telegramBot = null;
function getBot() {
  if (!telegramBot && process.env.TELEGRAM_BOT_TOKEN) {
    telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return telegramBot;
}

const analyzeCryptoMarket = new GameFunction({
  name: "analyze_crypto_market",
  description: "Fetches real-time crypto market data and returns analysis",
  args: [],
  executable: async () => {
    try {
      const ctx = await buildMarketContext();
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, JSON.stringify(ctx));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, e.message);
    }
  }
});

const getTrending = new GameFunction({
  name: "get_trending_coins",
  description: "Get top 5 trending cryptocurrencies globally",
  args: [],
  executable: async () => {
    try {
      const coins = await getTrendingCoins();
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        coins.map(c => `${c.name} (${c.symbol})`).join(", ")
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, e.message);
    }
  }
});

const postToTelegram = new GameFunction({
  name: "post_to_telegram",
  description: "Send market analysis to Telegram channel",
  args: [
    { name: "chat_id", type: "string", description: "Telegram chat ID" },
    { name: "message", type: "string", description: "Message to send" }
  ],
  executable: async (args) => {
    try {
      const bot = getBot();
      if (!bot) return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Bot not configured");
      await bot.sendMessage(args.chat_id, args.message, { parse_mode: "Markdown" });
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "Message sent!");
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, e.message);
    }
  }
});

const marketWorker = new GameWorker({
  id: "market_worker",
  name: "Market Intelligence Worker",
  description: "Monitors global crypto markets in real-time",
  functions: [analyzeCryptoMarket, getTrending],
  getEnvironment: async () => {
    const ctx = await buildMarketContext().catch(() => ({ summary: "Unavailable" }));
    return { current_market: ctx.summary, prices: ctx.prices, trending: ctx.trending, timestamp: new Date().toISOString() };
  }
});

const socialWorker = new GameWorker({
  id: "social_worker",
  name: "Social Publishing Worker",
  description: "Posts crypto insights to Telegram",
  functions: [postToTelegram],
  getEnvironment: async () => ({
    telegram_configured: !!process.env.TELEGRAM_BOT_TOKEN,
    telegram_channel: process.env.TELEGRAM_CHANNEL_ID || "not set"
  })
});

async function getAgentState() {
  const ctx = await buildMarketContext().catch(() => null);
  return {
    current_time: new Date().toISOString(),
    market_summary: ctx?.summary || "Unavailable",
    top_prices: ctx?.prices || "",
    trending_coins: ctx?.trending || "",
    telegram_channel: process.env.TELEGRAM_CHANNEL_ID || null
  };
}

function buildAgent() {
  if (!process.env.GAME_API_KEY) throw new Error("GAME_API_KEY missing!");
  return new GameAgent(process.env.GAME_API_KEY, {
    name: "Zero Cash Ai",
    goal: `You are Zero Cash Ai — a worldwide crypto intelligence agent.
Every hour:
1. Fetch current market data and trending coins
2. Write a sharp 2-3 sentence market analysis
3. Post it to the Telegram channel
Be concise, data-driven, globally relevant. No hype, just facts.`,
    description: "Sharp, data-driven crypto analyst. Covers global markets 24/7.",
    getAgentState,
    workers: [marketWorker, socialWorker]
  });
}

module.exports = { buildAgent };
