import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

// ✅ Ensure ENV Variables Load Ho Gayi
dotenv.config();

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINAY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = "general";
    if (file.fieldname === "profilePicture") {
      folder = "profile_pics";
    } else if (file.fieldname === "postImages") {
      folder = "posts";
    }

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg"],
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// ✅ File Filter (Optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and JPG files are allowed!"), false);
  }
};

// ✅ Multer Upload Middleware
const upload = multer({ storage, fileFilter });

// ✅ Single File Upload (Profile Picture)
export const uploadSingle = upload.single("profilePicture");

// ✅ Multiple Files Upload (Post Images)
export const uploadMultiple = upload.array("postImages", 10);

// ✅ Cloudinary Direct URL Proof
// ✔️ When file is uploaded, cloudinary will return a URL
// ✔️ No file will be saved on your server

// ✅ Example Response:
// {
//   url: "https://res.cloudinary.com/demo/image/upload/v12345678/image.jpg",
//   public_id: "posts/12345678-image.jpg"
// }

// ✅ Bhai ab tera pura upload system Cloud pe shift ho gaya! 🚀
// ✔️ No Disk Storage ✅
// ✔️ Direct Cloud URL ✅
// ✔️ Fast Performance ✅
