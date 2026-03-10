const axios = require("axios");
const BASE = "https://api.coingecko.com/api/v3";
const COINS = ["bitcoin","ethereum","virtual-protocol","solana","bnb","sui"];

async function getMarketSnapshot() {
  try {
    const res = await axios.get(`${BASE}/coins/markets`, {
      params: {
        vs_currency: "usd",
        ids: COINS.join(","),
        order: "market_cap_desc",
        sparkline: true,
        price_change_percentage: "1h,24h,7d"
      },
      timeout: 15000
    });
    return res.data.map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change1h: c.price_change_percentage_1h_in_currency?.toFixed(2),
      change24h: c.price_change_percentage_24h?.toFixed(2),
      change7d: c.price_change_percentage_7d_in_currency?.toFixed(2),
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      high24h: c.high_24h,
      low24h: c.low_24h,
      sparkline: c.sparkline_in_7d?.price || []
    }));
  } catch (err) {
    console.error("Market error:", err.message);
    return [];
  }
}

async function getTrendingCoins() {
  try {
    const res = await axios.get(`${BASE}/search/trending`, { timeout: 10000 });
    return res.data.coins.slice(0, 5).map(item => ({
      name: item.item.name,
      symbol: item.item.symbol,
      rank: item.item.market_cap_rank
    }));
  } catch (err) { return []; }
}

async function getGlobalStats() {
  try {
    const res = await axios.get(`${BASE}/global`, { timeout: 10000 });
    const d = res.data.data;
    return {
      totalMarketCap: d.total_market_cap.usd,
      totalVolume: d.total_volume.usd,
      btcDominance: d.market_cap_percentage.btc?.toFixed(1),
      ethDominance: d.market_cap_percentage.eth?.toFixed(1),
      marketCapChange24h: d.market_cap_change_percentage_24h_usd?.toFixed(2),
      activeCryptos: d.active_cryptocurrencies
    };
  } catch (err) { return {}; }
}

async function buildMarketContext() {
  const [markets, trending, global] = await Promise.all([
    getMarketSnapshot(), getTrendingCoins(), getGlobalStats()
  ]);
  const prices = markets.map(c =>
    `${c.symbol}: $${c.price?.toLocaleString()} (${c.change24h > 0 ? "+" : ""}${c.change24h}% 24h)`
  ).join("\n");
  const trendingStr = trending.map(t => t.name).join(", ");
  return {
    summary: `Market Cap: $${(global.totalMarketCap/1e9)?.toFixed(0)}B | 24h: ${global.marketCapChange24h}% | BTC Dom: ${global.btcDominance}%`,
    prices,
    trending: `🔥 Trending: ${trendingStr}`,
    raw: { markets, trending, global }
  };
}

async function checkPriceAlerts() {
  const markets = await getMarketSnapshot();
  const alerts = [];
  for (const coin of markets) {
    const change1h = parseFloat(coin.change1h);
    if (Math.abs(change1h) >= 5) {
      alerts.push({
        coin: coin.name,
        symbol: coin.symbol,
        price: coin.price,
        change1h,
        direction: change1h > 0 ? "🚀 PUMP" : "💥 DUMP"
      });
    }
  }
  return { alerts, markets };
}

module.exports = { getMarketSnapshot, getTrendingCoins, getGlobalStats, buildMarketContext, checkPriceAlerts };
