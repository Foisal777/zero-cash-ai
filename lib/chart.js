const axios = require("axios");

function generateSparklineChartUrl(coin) {
  const prices = coin.sparkline?.slice(-24) || [];
  if (prices.length < 2) return null;
  const color = coin.change24h >= 0 ? "rgb(0,200,100)" : "rgb(255,80,80)";
  const fillColor = coin.change24h >= 0 ? "rgba(0,200,100,0.1)" : "rgba(255,80,80,0.1)";
  const chartConfig = {
    type: "line",
    data: {
      labels: prices.map((_, i) => i % 6 === 0 ? `${i}h` : ""),
      datasets: [{
        label: `${coin.symbol}`,
        data: prices,
        borderColor: color,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${coin.name} (${coin.symbol}) — 7 Day`,
          color: "#ffffff",
          font: { size: 16, weight: "bold" }
        }
      },
      scales: {
        x: { ticks: { color: "#aaaaaa" }, grid: { color: "#333333" } },
        y: { ticks: { color: "#aaaaaa" }, grid: { color: "#333333" } }
      },
      backgroundColor: "#1a1a2e"
    }
  };
  return `https://quickchart.io/chart?w=600&h=300&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

function generateComparisonChartUrl(markets) {
  const coins = markets.slice(0, 5);
  const chartConfig = {
    type: "bar",
    data: {
      labels: coins.map(c => c.symbol),
      datasets: [{
        label: "24h Change %",
        data: coins.map(c => parseFloat(c.change24h)),
        backgroundColor: coins.map(c => parseFloat(c.change24h) >= 0 ? "rgba(0,200,100,0.8)" : "rgba(255,80,80,0.8)"),
        borderColor: coins.map(c => parseFloat(c.change24h) >= 0 ? "rgb(0,200,100)" : "rgb(255,80,80)"),
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: "24h Price Change (%)", color: "#ffffff", font: { size: 16, weight: "bold" } }
      },
      scales: {
        x: { ticks: { color: "#ffffff" }, grid: { color: "#333333" } },
        y: { ticks: { color: "#aaaaaa" }, grid: { color: "#333333" } }
      },
      backgroundColor: "#1a1a2e"
    }
  };
  return `https://quickchart.io/chart?w=600&h=350&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

async function downloadChart(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(res.data);
  } catch (err) {
    console.error("Chart error:", err.message);
    return null;
  }
}

module.exports = { generateSparklineChartUrl, generateComparisonChartUrl, downloadChart };
