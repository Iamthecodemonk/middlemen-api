const { Money } = require("../value-objects/Money");

class RentWallet {
  constructor({ tenantId, balance = 0 }) {
    this.tenantId = tenantId;
    this.balance = new Money(balance);
  }
}

module.exports = { RentWallet };
