const cloudinary = require("cloudinary").v2;

class CloudinaryService {
  constructor({ cloudName, apiKey, apiSecret }) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }

  uploadBuffer(buffer, filename, folder = "avatars") {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: filename, resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      const streamifier = require("streamifier");
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }
}

module.exports = { CloudinaryService };
