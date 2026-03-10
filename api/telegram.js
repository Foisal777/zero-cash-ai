require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { buildMarketContext, getTrendingCoins, getMarketSnapshot } = require("../lib/market");

let bot;
function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  return bot;
}

async function handleStart(chatId) {
  const msg = `🤖 *Zero Cash Ai Online!*\n\nPowered by Virtuals Protocol\n\n*Commands:*\n/market — Market snapshot\n/trending — Trending coins\n/btc — Bitcoin price\n/eth — Ethereum price\n/virtual — VIRTUAL token\n/help — This menu`;
  await getBot().sendMessage(chatId, msg, { parse_mode: "Markdown" });
}

async function handleMarket(chatId) {
  await getBot().sendMessage(chatId, "⏳ Fetching...");
  const ctx = await buildMarketContext();
  const msg = `📊 *Market Snapshot*\n\n${ctx.summary}\n\n*Prices:*\n${ctx.prices}\n\n${ctx.trending}\n\n_${new Date().toUTCString()}_`;
  await getBot().sendMessage(chatId, msg, { parse_mode: "Markdown" });
}

async function handleTrending(chatId) {
  await getBot().sendMessage(chatId, "🔍 Fetching...");
  const coins = await getTrendingCoins();
  const list = coins.map((c, i) => `${i + 1}. *${c.name}* (${c.symbol})`).join("\n");
  await getBot().sendMessage(chatId, `🔥 *Trending Now*\n\n${list}`, { parse_mode: "Markdown" });
}

async function handleCoin(chatId, symbol) {
  const markets = await getMarketSnapshot();
  const map = { btc: "bitcoin", eth: "ethereum", virtual: "virtual-protocol" };
  const coin = markets.find(c => c.id === map[symbol]);
  if (!coin) { await getBot().sendMessage(chatId, "❌ Not found"); return; }
  const emoji = coin.change24h > 0 ? "📈" : "📉";
  const msg = `${emoji} *${coin.name} (${coin.symbol})*\n\nPrice: *$${coin.price?.toLocaleString()}*\n24h: ${coin.change24h > 0 ? "+" : ""}${coin.change24h}%\n7d: ${coin.change7d > 0 ? "+" : ""}${coin.change7d}%\nMarket Cap: $${(coin.marketCap / 1e9)?.toFixed(2)}B`;
  await getBot().sendMessage(chatId, msg, { parse_mode: "Markdown" });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(200).json({ status: "Webhook active" });
  const b = getBot();
  if (!b) return res.status(500).json({ error: "Bot not configured" });
  try {
    const message = req.body.message || req.body.edited_message;
    if (!message?.text) return res.status(200).json({ ok: true });
    const chatId = message.chat.id;
    const text = message.text.toLowerCase().trim();
    if (text === "/start" || text === "/help") await handleStart(chatId);
    else if (text === "/market") await handleMarket(chatId);
    else if (text === "/trending") await handleTrending(chatId);
    else if (text === "/btc") await handleCoin(chatId, "btc");
    else if (text === "/eth") await handleCoin(chatId, "eth");
    else if (text === "/virtual") await handleCoin(chatId, "virtual");
    else await b.sendMessage(chatId, "Unknown command. Use /help 😊");
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true });
  }
};
