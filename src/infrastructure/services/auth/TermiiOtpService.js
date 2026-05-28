const { AppError } = require("../../../shared/errors/AppError");

class TermiiOtpService {
  constructor({
    apiKey,
    baseUrl,
    senderId,
    channel,
    pinAttempts,
    pinLength,
    ttlSeconds
  }) {
    this.apiKey = apiKey;
    this.baseUrl = stripTrailingSlash(baseUrl);
    this.senderId = senderId;
    this.channel = channel;
    this.pinAttempts = pinAttempts;
    this.pinLength = pinLength;
    this.ttlMinutes = Math.max(1, Math.ceil(ttlSeconds / 60));
  }

  isConfigured() {
    return Boolean(this.apiKey && this.baseUrl && this.senderId);
  }

  async sendSmsOtp({ to }) {
    this.assertConfigured();

    const placeholder = `< ${"0".repeat(this.pinLength)} >`;
    const response = await this.post("/api/sms/otp/send", {
      api_key: this.apiKey,
      message_type: "NUMERIC",
      to: normalizePhone(to),
      from: this.senderId,
      channel: this.channel,
      pin_attempts: this.pinAttempts,
      pin_time_to_live: this.ttlMinutes,
      pin_length: this.pinLength,
      pin_placeholder: placeholder,
      message_text: `Your MiddleMan verification code is ${placeholder}`,
      pin_type: "NUMERIC"
    });

    const pinId = response.pin_id || response.pinId;
    if (!pinId) {
      throw new AppError("Termii did not return an OTP reference", 502);
    }

    return { pinId };
  }

  async verifySmsOtp({ pinId, pin }) {
    this.assertConfigured();

    const response = await this.post("/api/sms/otp/verify", {
      api_key: this.apiKey,
      pin_id: pinId,
      pin
    });

    if (String(response.verified).toLowerCase() !== "true") {
      throw new AppError("OTP is invalid or expired", 400);
    }

    return response;
  }

  async post(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = {};
    }

    if (!response.ok) {
      throw new AppError(payload.message || "Termii OTP request failed", 502);
    }

    return payload;
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new AppError("Termii SMS OTP is not configured", 503);
    }
  }
}

function stripTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "");
}

module.exports = { TermiiOtpService };
