const nodemailer = require("nodemailer");
const { AppError } = require("../../../shared/errors/AppError");

class SmtpEmailService {
  constructor({
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromAddress,
    connectionTimeoutMs,
    greetingTimeoutMs
  }) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.user = user;
    this.pass = pass;
    this.fromName = fromName;
    this.fromAddress = fromAddress;
    this.connectionTimeoutMs = connectionTimeoutMs;
    this.greetingTimeoutMs = greetingTimeoutMs;
    this.transporter = null;
  }

  isConfigured() {
    return Boolean(this.host && this.port && this.user && this.pass && this.fromAddress);
  }

  async sendMail({ to, subject, text, html }) {
    this.assertConfigured();

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: this.formatFrom(),
        to,
        subject,
        text,
        html
      });
    } catch (error) {
      throw new AppError("Email delivery failed", 502, {
        cause: error,
        details: {
          smtpHost: this.host,
          smtpPort: this.port,
          smtpSecure: this.secure,
          smtpUserConfigured: Boolean(this.user),
          smtpFromAddressConfigured: Boolean(this.fromAddress)
        }
      });
    }
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass
        },
        connectionTimeout: this.connectionTimeoutMs,
        greetingTimeout: this.greetingTimeoutMs
      });
    }

    return this.transporter;
  }

  formatFrom() {
    if (!this.fromName) {
      return this.fromAddress;
    }

    return `"${this.fromName}" <${this.fromAddress}>`;
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new AppError("SMTP email delivery is not configured", 503);
    }
  }
}

module.exports = { SmtpEmailService };
