const { Money } = require("../value-objects/Money");

class PropertyListing {
  constructor({
    id,
    ownerId,
    title,
    description,
    propertyType = "rent",
    state,
    city,
    address,
    latitude,
    longitude,
    bedrooms = 1,
    bathrooms = 1,
    squareMeters,
    rentAmount,
    securityDeposit,
    paymentMode,
    renewalMode,
    leaseTermMonths,
    isAvailable = true,
    commissionRate = 7
  }) {
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.description = description;
    this.propertyType = propertyType;
    this.state = state;
    this.city = city;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.bedrooms = bedrooms;
    this.bathrooms = bathrooms;
    this.squareMeters = squareMeters;
    this.rentAmount = new Money(rentAmount);
    this.securityDeposit = new Money(securityDeposit || 0);
    this.paymentMode = paymentMode;
    this.renewalMode = renewalMode;
    this.leaseTermMonths = leaseTermMonths;
    this.isAvailable = isAvailable;
    this.commissionRate = commissionRate;
  }

  markClaimed() {
    this.isAvailable = false;
  }

  totalMoveInCost() {
    return this.rentAmount.add(this.securityDeposit);
  }
}

module.exports = { PropertyListing };
