const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

async function start() {
  try {
    await connectDB(env.MONGO_URI);
    app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("Server failed:", err.message);
    process.exit(1);
  }
}

start();
