const axios = require("axios");

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TRACKED_COINS = ["bitcoin","ethereum","virtual-protocol","solana","bnb"];

async function getMarketSnapshot() {
  try {
    const res = await axios.get(`${COINGECKO_BASE}/coins/markets`, {
      params: {
        vs_currency: "usd",
        ids: TRACKED_COINS.join(","),
        order: "market_cap_desc",
        sparkline: false,
        price_change_percentage: "24h,7d"
      },
      timeout: 10000
    });
    return res.data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h?.toFixed(2),
      change7d: coin.price_change_percentage_7d_in_currency?.toFixed(2),
      marketCap: coin.market_cap,
      volume24h: coin.total_volume
    }));
  } catch (err) {
    console.error("Market fetch error:", err.message);
    return [];
  }
}

async function getTrendingCoins() {
  try {
    const res = await axios.get(`${COINGECKO_BASE}/search/trending`, { timeout: 10000 });
    return res.data.coins.slice(0, 5).map(item => ({
      name: item.item.name,
      symbol: item.item.symbol,
      rank: item.item.market_cap_rank
    }));
  } catch (err) {
    console.error("Trending fetch error:", err.message);
    return [];
  }
}

async function getGlobalStats() {
  try {
    const res = await axios.get(`${COINGECKO_BASE}/global`, { timeout: 10000 });
    const d = res.data.data;
    return {
      totalMarketCap: d.total_market_cap.usd,
      totalVolume: d.total_volume.usd,
      btcDominance: d.market_cap_percentage.btc?.toFixed(1),
      ethDominance: d.market_cap_percentage.eth?.toFixed(1),
      marketCapChange24h: d.market_cap_change_percentage_24h_usd?.toFixed(2),
      activeCryptos: d.active_cryptocurrencies
    };
  } catch (err) {
    console.error("Global stats error:", err.message);
    return {};
  }
}

async function buildMarketContext() {
  const [markets, trending, global] = await Promise.all([
    getMarketSnapshot(), getTrendingCoins(), getGlobalStats()
  ]);
  const marketStr = markets.map(c =>
    `${c.symbol}: $${c.price?.toLocaleString()} (${c.change24h > 0 ? "+" : ""}${c.change24h}% 24h)`
  ).join(", ");
  const trendingStr = trending.map(t => t.name).join(", ");
  return {
    summary: `Global Market Cap: $${(global.totalMarketCap / 1e9)?.toFixed(0)}B | 24h Change: ${global.marketCapChange24h}% | BTC Dom: ${global.btcDominance}%`,
    prices: marketStr,
    trending: `Trending: ${trendingStr}`,
    raw: { markets, trending, global }
  };
}

module.exports = { getMarketSnapshot, getTrendingCoins, getGlobalStats, buildMarketContext };
