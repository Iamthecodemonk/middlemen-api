class AuthDeliveryService {
  async sendOtp({ channel, destination, code }) {
    console.log(`OTP via ${channel} to ${destination}: ${code}`);
  }

  async sendPasswordReset({ channel, destination, token }) {
    console.log(`Password reset via ${channel} to ${destination}: ${token}`);
  }
}

module.exports = { AuthDeliveryService };
