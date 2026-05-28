class AuthDeliveryService {
  constructor({ emailService, smsService }) {
    this.emailService = emailService;
    this.smsService = smsService;
  }

  async sendOtp({ channel, destination, code }) {
    if (channel === "sms") {
      await this.smsService.sendText({
        to: destination,
        message: `Your MiddleMan verification code is ${code}. It expires shortly.`
      });
      return;
    }

    await this.emailService.sendMail({
      to: destination,
      subject: "Your MiddleMan verification code",
      text: `Your MiddleMan verification code is ${code}. It expires shortly.`,
      html: `<p>Your MiddleMan verification code is <strong>${code}</strong>.</p><p>It expires shortly.</p>`
    });
  }

  async sendPasswordReset({ channel, destination, token }) {
    if (channel === "sms") {
      await this.smsService.sendText({
        to: destination,
        message: `Use this MiddleMan password reset token: ${token}`
      });
      return;
    }

    await this.emailService.sendMail({
      to: destination,
      subject: "Reset your MiddleMan password",
      text: `Use this password reset token to reset your MiddleMan password: ${token}`,
      html: `<p>Use this password reset token to reset your MiddleMan password:</p><p><strong>${token}</strong></p>`
    });
  }
}

module.exports = { AuthDeliveryService };
