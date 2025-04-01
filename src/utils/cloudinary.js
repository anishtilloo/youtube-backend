import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return { message: "No Local Path Found" };
    // upload file on cloudinary
    const responseFromCloudinary = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
        media_metadata: true,
      }
    );
    // file has been uploaded successful
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return responseFromCloudinary;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return {
      error: error,
      message: "The upload operation got failed",
    };
  }
};

const deleteImageOnCloudinary = async (publicId) => {
  try {
    if (!publicId) return { message: "No public id Found" };
    const responseFromCloudinary = await cloudinary.uploader.destroy(
      publicId, 
      {
        resource_type: 'image', 
        invalidate: true
      }
    );
    return responseFromCloudinary;
  } catch (error) {
    return { 
      error: error,
      message: "The delete operation got failed" 
    };
  }
};

const deleteVideosOnCloudinary = async (publicId) => {
  try {
    if (!publicId) return { message: "No public id Found" };
    const responseFromCloudinary = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
      invalidate: true,
    });
    return responseFromCloudinary;
  } catch (error) {
    return {
      error: error,
      message: "The delete operation got failed",
    };
  }
};

export {
  uploadOnCloudinary,
  deleteImageOnCloudinary,
  deleteVideosOnCloudinary,
};
