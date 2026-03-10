require("dotenv").config();
const { runHourlyUpdate, runAlertCheck } = require("./lib/agent");

console.log("🤖 Zero Cash Ai v2 Started!");

let tickCount = 0;

async function tick() {
  tickCount++;
  const now = new Date().toISOString();
  if (tickCount === 1 || tickCount % 4 === 0) {
    console.log(`[${now}] 📊 Hourly update...`);
    try { await runHourlyUpdate(); } catch (err) { console.error("Update error:", err.message); }
  }
  console.log(`[${now}] ⚡ Alert check...`);
  try { await runAlertCheck(); } catch (err) { console.error("Alert error:", err.message); }
}

tick();
setInterval(tick, 15 * 60 * 1000);
