const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
function getAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function generateAnalysis(marketData) {
  const ai = getAI();
  if (!ai) return fallback(marketData);
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `You are Zero Cash Ai, a sharp crypto intelligence agent.
Analyze this market data and write a 3-4 sentence insightful analysis for worldwide crypto investors.
Be specific with numbers. Give one clear actionable insight. No markdown headers.

Market: ${marketData.summary}
Prices: ${marketData.prices}
${marketData.trending}

Write analysis:`
    );
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini error:", err.message);
    return fallback(marketData);
  }
}

async function answerQuestion(question, marketData) {
  const ai = getAI();
  if (!ai) return "AI unavailable. Current market: " + marketData.summary;
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `You are Zero Cash Ai, a helpful crypto assistant.
Answer this question in 3-4 sentences using the market data below.

Market: ${marketData.summary}
Prices: ${marketData.prices}
${marketData.trending}

Question: ${question}
Answer:`
    );
    return result.response.text().trim();
  } catch (err) {
    return "Sorry, couldn't process your question right now. Try again!";
  }
}

async function generateAlertAnalysis(alert, marketData) {
  const ai = getAI();
  if (!ai) return `${alert.direction} on ${alert.coin}! Moved ${alert.change1h > 0 ? "+" : ""}${alert.change1h}% in 1 hour.`;
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Write a 2-sentence urgent crypto alert.
${alert.coin} moved ${alert.change1h}% in 1 hour. Price: $${alert.price?.toLocaleString()}
Context: ${marketData.summary}
Alert:`
    );
    return result.response.text().trim();
  } catch (err) {
    return `${alert.direction}! ${alert.coin} moved ${alert.change1h > 0 ? "+" : ""}${alert.change1h}% in 1 hour.`;
  }
}

function fallback(marketData) {
  const btc = marketData.raw?.markets?.find(c => c.id === "bitcoin");
  const trend = btc?.change24h > 0 ? "bullish" : "bearish";
  return `The crypto market is showing ${trend} momentum. BTC ${btc?.change24h > 0 ? "gained" : "lost"} ${Math.abs(btc?.change24h)}% in 24h. ${marketData.trending}. Monitor key support levels closely.`;
}

module.exports = { generateAnalysis, answerQuestion, generateAlertAnalysis };
