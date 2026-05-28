class LoggerService {
  static createFastifyLoggerConfig(env) {
    if (!env.logEnabled) {
      return false;
    }

    return {
      level: env.logLevel,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "password",
          "passwordHash",
          "smtpPass",
          "token",
          "refreshToken"
        ],
        censor: "[redacted]"
      }
    };
  }
}

module.exports = { LoggerService };
