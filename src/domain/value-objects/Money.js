class Money {
  constructor(amount, currency = "NGN") {
    if (Number.isNaN(Number(amount))) {
      throw new Error("Invalid money amount");
    }

    this.amount = Number(amount);
    this.currency = currency;
  }

  add(otherMoney) {
    this.assertCurrency(otherMoney);
    return new Money(this.amount + otherMoney.amount, this.currency);
  }

  subtract(otherMoney) {
    this.assertCurrency(otherMoney);
    return new Money(this.amount - otherMoney.amount, this.currency);
  }

  multiply(multiplier) {
    return new Money(this.amount * multiplier, this.currency);
  }

  assertCurrency(otherMoney) {
    if (this.currency !== otherMoney.currency) {
      throw new Error("Currency mismatch");
    }
  }
}

module.exports = { Money };
