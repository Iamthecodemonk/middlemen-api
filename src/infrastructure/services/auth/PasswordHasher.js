const bcrypt = require("bcryptjs");

class PasswordHasher {
  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, 12);
  }

  async compare(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

module.exports = { PasswordHasher };
