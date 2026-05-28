const { AppError } = require("../../../shared/errors/AppError");

class TermiiSmsService {
  constructor({ apiKey, baseUrl, senderId, channel }) {
    this.apiKey = apiKey;
    this.baseUrl = stripTrailingSlash(baseUrl);
    this.senderId = senderId;
    this.channel = channel;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.baseUrl && this.senderId);
  }

  async sendText({ to, message, channel = this.channel }) {
    this.assertConfigured();

    const response = await fetch(`${this.baseUrl}/api/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        to: normalizePhone(to),
        from: this.senderId,
        sms: message,
        type: "plain",
        channel
      })
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = {};
    }

    if (!response.ok) {
      throw new AppError(payload.message || "Termii SMS request failed", 502);
    }

    return payload;
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new AppError("Termii SMS delivery is not configured", 503);
    }
  }
}

function stripTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "");
}

module.exports = { TermiiSmsService };
