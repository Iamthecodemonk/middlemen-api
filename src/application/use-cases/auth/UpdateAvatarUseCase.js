const { AppError } = require("../../../shared/errors/AppError");

class UpdateAvatarUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ userId, avatarUrl }) {
    if (!userId) {
      throw new AppError("Missing user id", 400);
    }

    if (!avatarUrl || typeof avatarUrl !== "string") {
      throw new AppError("Invalid avatarUrl", 422);
    }

    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    const updated = await this.userRepository.updateAvatar(userId, avatarUrl);
    if (!updated) {
      throw new AppError("Failed to update avatar", 500);
    }

    return sanitizeUser(updated);
  }
}

function sanitizeUser(user) {
  const { passwordHash, googleId, ...safeUser } = user;
  return safeUser;
}

module.exports = { UpdateAvatarUseCase };
