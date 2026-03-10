require("dotenv").config();
const axios = require("axios");

async function setup() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = process.argv[2];
  if (!token) { console.error("❌ TELEGRAM_BOT_TOKEN missing"); process.exit(1); }
  if (!url) { console.error("❌ Usage: node scripts/setup-telegram.js https://your-app.vercel.app"); process.exit(1); }
  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, { url: `${url}/api/telegram` });
    if (res.data.ok) console.log("✅ Telegram webhook set!");
    else console.error("❌ Failed:", res.data);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}
setup();
