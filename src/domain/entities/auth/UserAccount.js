class UserAccount {
  constructor({
    id,
    fullName,
    email,
    phone,
    role,
    userTier,
    isBvnVerified,
    isVerified,
    mfaChannel,
    googleId,
    avatarUrl,
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
    this.isBvnVerified = isBvnVerified;
    this.isVerified = isVerified;
    this.mfaChannel = mfaChannel;
    this.googleId = googleId;
    this.avatarUrl = avatarUrl;
    this.isActive = isActive;
    this.trustScore = trustScore;
    this.createdAt = createdAt;
  }
}

module.exports = { UserAccount };
