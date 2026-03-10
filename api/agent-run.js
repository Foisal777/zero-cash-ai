require("dotenv").config();
const { buildAgent } = require("../lib/agent");

module.exports = async (req, res) => {
  console.log(`[${new Date().toISOString()}] Agent triggered`);
  try {
    const agent = buildAgent();
    await agent.init();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 45000));
    await Promise.race([agent.run(1), timeout]);
    return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

if (require.main === module) {
  async function runLocally() {
    console.log("🤖 Zero Cash Ai starting...\n");
    if (!process.env.GAME_API_KEY) {
      console.error("❌ GAME_API_KEY missing in .env");
      process.exit(1);
    }
    try {
      const agent = buildAgent();
      await agent.init();
      console.log("✅ Agent initialized!\n");
      await agent.run(3, { verbose: true });
      console.log("\n✅ Done!");
    } catch (err) {
      console.error("❌ Error:", err.message);
      process.exit(1);
    }
  }
  runLocally();
}
