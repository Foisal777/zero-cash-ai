require("dotenv").config();
const { getGlobalStats } = require("../lib/market");
module.exports = async (req, res) => {
  try {
    const stats = await getGlobalStats();
    res.status(200).json({
      status: "online", agent: "Zero Cash Ai v2",
      features: ["AI Analysis","Price Alerts","Charts","Q&A Bot"],
      market: {
        total_market_cap: `$${(stats.totalMarketCap/1e9)?.toFixed(0)}B`,
        btc_dominance: `${stats.btcDominance}%`,
        change_24h: `${stats.marketCapChange24h}%`
      },
      config: {
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        gemini_ai: !!process.env.GEMINI_API_KEY
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
