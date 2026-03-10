require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { buildMarketContext, getMarketSnapshot, getTrendingCoins } = require("../lib/market");
const { answerQuestion, generateAnalysis } = require("../lib/ai");
const { generateSparklineChartUrl, generateComparisonChartUrl, downloadChart } = require("../lib/chart");

let bot;
function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  return bot;
}

async function handleStart(chatId) {
  const msg = `🤖 *Zero Cash Ai v2 — Online!*\n\n` +
    `_AI-Powered Crypto Intelligence_\n\n` +
    `*Commands:*\n` +
    `/market — Live market + chart\n` +
    `/analysis — AI market analysis\n` +
    `/trending — Trending coins\n` +
    `/btc — Bitcoin deep dive\n` +
    `/eth — Ethereum deep dive\n` +
    `/sol — Solana deep dive\n` +
    `/virtual — VIRTUAL token\n` +
    `/ask [question] — Ask AI anything!\n\n` +
    `💡 *Example:* /ask Is now a good time to buy ETH?\n\n` +
    `Powered by Virtuals Protocol 🚀`;
  await getBot().sendMessage(chatId, msg, { parse_mode: "Markdown" });
}

async function handleMarket(chatId) {
  await getBot().sendMessage(chatId, "⏳ Fetching live data...");
  const ctx = await buildMarketContext();
  const chartBuffer = await downloadChart(generateComparisonChartUrl(ctx.raw.markets));
  const caption = `📊 *Live Market Snapshot*\n\n${ctx.summary}\n\n💰 *Prices:*\n${ctx.prices}\n\n${ctx.trending}\n\n_${new Date().toUTCString()}_`;
  if (chartBuffer) {
    await getBot().sendPhoto(chatId, chartBuffer, { caption, parse_mode: "Markdown" });
  } else {
    await getBot().sendMessage(chatId, caption, { parse_mode: "Markdown" });
  }
}

async function handleAnalysis(chatId) {
  await getBot().sendMessage(chatId, "🧠 Generating AI analysis...");
  const ctx = await buildMarketContext();
  const analysis = await generateAnalysis(ctx);
  await getBot().sendMessage(chatId,
    `🧠 *AI Market Analysis*\n\n${analysis}\n\n📊 ${ctx.summary}\n\n_Powered by Google Gemini_`,
    { parse_mode: "Markdown" }
  );
}

async function handleTrending(chatId) {
  const coins = await getTrendingCoins();
  const list = coins.map((c, i) => `${i + 1}. *${c.name}* (${c.symbol})`).join("\n");
  await getBot().sendMessage(chatId, `🔥 *Trending Now*\n\n${list}`, { parse_mode: "Markdown" });
}

async function handleCoin(chatId, coinId) {
  await getBot().sendMessage(chatId, "⏳ Fetching...");
  const markets = await getMarketSnapshot();
  const map = { btc: "bitcoin", eth: "ethereum", virtual: "virtual-protocol", sol: "solana" };
  const coin = markets.find(c => c.id === (map[coinId] || coinId));
  if (!coin) { await getBot().sendMessage(chatId, "❌ Coin not found"); return; }
  const emoji = parseFloat(coin.change24h) > 0 ? "📈" : "📉";
  const chartBuffer = coin.sparkline?.length > 2 ? await downloadChart(generateSparklineChartUrl(coin)) : null;
  const caption = `${emoji} *${coin.name} (${coin.symbol})*\n\n` +
    `💵 Price: *$${coin.price?.toLocaleString()}*\n` +
    `1h: ${coin.change1h > 0 ? "+" : ""}${coin.change1h}%\n` +
    `24h: ${coin.change24h > 0 ? "+" : ""}${coin.change24h}%\n` +
    `7d: ${coin.change7d > 0 ? "+" : ""}${coin.change7d}%\n\n` +
    `📊 Market Cap: $${(coin.marketCap/1e9)?.toFixed(2)}B\n` +
    `📦 Volume: $${(coin.volume24h/1e6)?.toFixed(0)}M\n` +
    `🔺 High 24h: $${coin.high24h?.toLocaleString()}\n` +
    `🔻 Low 24h: $${coin.low24h?.toLocaleString()}`;
  if (chartBuffer) {
    await getBot().sendPhoto(chatId, chartBuffer, { caption, parse_mode: "Markdown" });
  } else {
    await getBot().sendMessage(chatId, caption, { parse_mode: "Markdown" });
  }
}

async function handleAsk(chatId, question) {
  if (!question || question.trim().length < 3) {
    await getBot().sendMessage(chatId, "❓ Example: /ask Will BTC reach 100k?");
    return;
  }
  await getBot().sendMessage(chatId, `🧠 Thinking about: "${question}"...`);
  const ctx = await buildMarketContext();
  const answer = await answerQuestion(question, ctx);
  await getBot().sendMessage(chatId,
    `🤖 *Zero Cash Ai*\n\n❓ *${question}*\n\n${answer}\n\n_Powered by Google Gemini_`,
    { parse_mode: "Markdown" }
  );
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(200).json({ status: "Zero Cash Ai v2 active" });
  const b = getBot();
  if (!b) return res.status(500).json({ error: "Bot not configured" });
  try {
    const message = req.body.message || req.body.edited_message;
    if (!message?.text) return res.status(200).json({ ok: true });
    const chatId = message.chat.id;
    const text = message.text.trim();
    const lower = text.toLowerCase();
    if (lower.startsWith("/start") || lower.startsWith("/help")) await handleStart(chatId);
    else if (lower.startsWith("/market")) await handleMarket(chatId);
    else if (lower.startsWith("/analysis")) await handleAnalysis(chatId);
    else if (lower.startsWith("/trending")) await handleTrending(chatId);
    else if (lower.startsWith("/btc")) await handleCoin(chatId, "btc");
    else if (lower.startsWith("/eth")) await handleCoin(chatId, "eth");
    else if (lower.startsWith("/sol")) await handleCoin(chatId, "sol");
    else if (lower.startsWith("/virtual")) await handleCoin(chatId, "virtual");
    else if (lower.startsWith("/ask ")) await handleAsk(chatId, text.slice(5).trim());
    else if (!lower.startsWith("/")) await handleAsk(chatId, text);
    else await b.sendMessage(chatId, "Unknown command. Use /help 😊");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(200).json({ ok: true });
  }
};
