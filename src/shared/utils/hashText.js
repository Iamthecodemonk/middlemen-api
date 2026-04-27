const crypto = require("crypto");

function hashText(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = { hashText };
