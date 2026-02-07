const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'sumpro_resumes',

      // 🔥 IMPORTANT FIX
      resource_type: 'raw',

      public_id: `${file.fieldname}-${Date.now()}`,

      // keep original extension
      format: file.originalname.split('.').pop(),
    };
  },
});

module.exports = { cloudinary, storage };
