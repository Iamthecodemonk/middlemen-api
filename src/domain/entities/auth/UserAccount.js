class UserAccount {
  constructor({
    id,
    fullName,
    email,
    phone,
    role,
    userTier,
    isVerified,
    mfaChannel,
    isActive,
    trustScore,
    createdAt
  }) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.userTier = userTier;
    this.isVerified = isVerified;
    this.mfaChannel = mfaChannel;
    this.isActive = isActive;
    this.trustScore = trustScore;
    this.createdAt = createdAt;
  }
}

module.exports = { UserAccount };
