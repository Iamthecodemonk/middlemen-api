const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  appName: process.env.APP_NAME || "middlemen-rental-platform",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/middlemen",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "change_me_access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_refresh_secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
  otpResendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
  loginRateLimitWindowSeconds: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS || 900),
  googleClientId: process.env.GOOGLE_CLIENT_ID || ""
};

module.exports = { env };
