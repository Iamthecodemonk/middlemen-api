const { v4: uuidv4 } = require("uuid");
const { PropertyListing } = require("../../domain/entities/PropertyListing");

class CreatePropertyListingUseCase {
  constructor({ propertyRepository }) {
    this.propertyRepository = propertyRepository;
  }

  async execute(input) {
    const property = new PropertyListing({
      id: uuidv4(),
      ...input
    });

    await this.propertyRepository.create(property);
    return property;
  }
}

module.exports = { CreatePropertyListingUseCase };
