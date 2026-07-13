"use strict";

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Check if credentials are fully configured
const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("[Cloudinary] Successfully configured and initialized.");
} else {
  console.log("[Cloudinary] Configuration parameters not set. Falling back to local disk uploads.");
}

/**
 * Upload a locally saved file to Cloudinary.
 *
 * @param {string} localFilePath - Path of the file on local disk
 * @returns {Promise<string|null>} Secure CDN URL of the uploaded file, or null if failed/disabled
 */
const uploadToCloudinary = async (localFilePath) => {
  if (!isConfigured) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "healthconnect"
    });
    
    // Clean up/delete local staging file once uploaded to CDN
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary] Error uploading file:", error.message);
    return null;
  }
};

module.exports = { uploadToCloudinary };
