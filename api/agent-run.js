require("dotenv").config();
const { runAgent } = require("../lib/agent");

module.exports = async (req, res) => {
  console.log(`[${new Date().toISOString()}] Agent triggered`);
  try {
    const result = await runAgent();
    return res.status(200).json({ success: true, data: result.summary });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

if (require.main === module) {
  runAgent().then(() => process.exit(0)).catch(err => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
