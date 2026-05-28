const cloudinary = require('cloudinary').v2;

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return true;
}

function isConfigured() {
  return configureCloudinary();
}

/**
 * @param {Buffer} buffer
 * @param {{ folder?: string; publicId?: string }} [options]
 */
function uploadImageBuffer(buffer, options = {}) {
  if (!isConfigured()) {
    return Promise.reject(new Error('Cloudinary is not configured on the server.'));
  }
  const folder = options.folder || process.env.CLOUDINARY_PROJECT_FOLDER || 'bluank';
  const uploadOptions = {
    folder,
    resource_type: 'image',
  };
  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
    uploadOptions.overwrite = true;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = {
  isConfigured,
  uploadImageBuffer,
};
