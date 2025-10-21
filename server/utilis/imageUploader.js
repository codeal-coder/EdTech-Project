// const cloudinary = require('cloudinary');

// exports.uploaderToCloudinary = async(file,folder,height,quality) =>{
//     const options = {folder};

//     if (height) {
//         options.height = height;
//     }
//     if (quality) {
//         options.quality = quality;

//     }
//     options.resoure_type = "auto";

//     return await cloudinary.uploader.upload(file.tempFilePath, options);
// }

const cloudinary = require('cloudinary').v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECERET,
});

exports.uploaderToCloudinary = async (file, folder, height, quality) => {
  const options = { folder };

  if (height) options.height = height;
  if (quality) options.quality = quality;

  console.log("temp file path is : " , file.tempFilePath);

  options.resource_type = "auto";

    
  return await cloudinary.uploader.upload(file.tempFilePath, options);
};
