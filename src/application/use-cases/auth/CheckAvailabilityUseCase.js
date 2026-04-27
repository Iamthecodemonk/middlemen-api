class CheckAvailabilityUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ email, phone }) {
    const [emailTaken, phoneTaken] = await Promise.all([
      this.userRepository.isEmailTaken(email),
      phone ? this.userRepository.isPhoneTaken(phone) : Promise.resolve(false)
    ]);

    return {
      emailAvailable: email ? !emailTaken : true,
      phoneAvailable: phone ? !phoneTaken : true
    };
  }
}

module.exports = { CheckAvailabilityUseCase };
