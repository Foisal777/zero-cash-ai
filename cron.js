require("dotenv").config();
const { runAgent } = require("./lib/agent");

console.log("🤖 Zero Cash Ai Cron Started");

// প্রতি ঘণ্টায় run করবে
async function tick() {
  console.log(`[${new Date().toISOString()}] Running...`);
  try {
    await runAgent();
    console.log("✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// সাথে সাথে একবার run করো
tick();

// তারপর প্রতি ঘণ্টায়
setInterval(tick, 60 * 60 * 1000);
