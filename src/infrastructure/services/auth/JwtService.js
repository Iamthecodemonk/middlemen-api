const jwt = require("jsonwebtoken");

class JwtService {
  constructor({ accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn }) {
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = accessExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  signAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        isVerified: user.isVerified
      },
      this.accessSecret,
      { expiresIn: this.accessExpiresIn }
    );
  }

  signRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        type: "refresh"
      },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshSecret);
  }
}

module.exports = { JwtService };
