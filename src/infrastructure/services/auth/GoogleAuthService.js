const { AppError } = require("../../../shared/errors/AppError");

class GoogleAuthService {
  constructor({ clientId }) {
    this.clientId = clientId;
  }

  async verifyIdToken(idToken) {
    if (!this.clientId) {
      throw new AppError("Google OAuth is not configured", 503);
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      throw new AppError("Invalid Google credential", 401);
    }

    const payload = await response.json();
    if (payload.aud !== this.clientId) {
      throw new AppError("Invalid Google credential audience", 401);
    }

    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      throw new AppError("Google email is not verified", 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email,
      avatarUrl: payload.picture || null
    };
  }
}

module.exports = { GoogleAuthService };
