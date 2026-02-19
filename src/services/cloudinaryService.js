require("dotenv").config();
const cloudinary = require("cloudinary").v2;

/* ===== CONFIG ===== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const bufferToDataUri = (buffer, mime = "image/jpeg") => {
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

const uploadImage = async (buffer, options = {}) => {
  try {
    const dataUri = bufferToDataUri(buffer, options.mime);

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: options.folder || "uploads",
      public_id: options.publicId,
      overwrite: true,
      resource_type: "image",
      transformation: options.transformation || []
    });

    return result;

  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
