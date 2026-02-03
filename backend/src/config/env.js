const AppError = require("../utils/AppError");

function requireEnv(key) {
  const v = process.env[key];
  if (!v) throw new AppError(`Missing environment variable: ${key}`, 500);
  return v;
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: requireEnv("MONGO_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
};
