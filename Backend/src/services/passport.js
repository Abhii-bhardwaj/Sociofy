import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import axios from "axios";
import { uploadSingle } from "../middleware/multer.js"; // Your existing Cloudinary setup file
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary directory for downloaded images
const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5001/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile._json); // Debug Google response

        let user = await User.findOne({ googleId: profile.id });

        // Fallback for username
       const username = profile.emails[0].value.split("@")[0];

        // Get high-resolution Google profile pic
        const googleProfilePic = profile.photos[0].value.replace(
          "s96-c",
          "s400-c"
        );

        // Download Google profile pic to temporary file
        const tempFilePath = path.join(TEMP_DIR, `${Date.now()}-profile.jpg`);
        const response = await axios.get(googleProfilePic, {
          responseType: "arraybuffer",
        });
        fs.writeFileSync(tempFilePath, Buffer.from(response.data));

        // Prepare request object for multer
        const req = {
          file: {
            path: tempFilePath,
            originalname: path.basename(tempFilePath),
            mimetype: "image/jpeg",
          },
        };

        // Upload to Cloudinary using existing uploadSingle middleware
        let profilePicUrl = googleProfilePic; // Fallback
        try {
          await new Promise((resolve, reject) => {
            uploadSingle(req, null, (err) => {
              if (err) {
                console.error("Multer upload error:", err.message);
                return reject(err);
              }
              if (!req.file) {
                return reject(new Error("No file uploaded by multer"));
              }
              console.log("Cloudinary URL:", req.file.path); // Debug Cloudinary URL
              resolve();
            });
          });
          profilePicUrl = req.file.path; // Cloudinary URL
        } catch (error) {
          console.warn(
            "Multer failed, trying direct Cloudinary upload:",
            error.message
          );
          // Fallback to direct Cloudinary upload
          try {
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload(
                tempFilePath,
                {
                  folder: "profile_pics",
                  allowed_formats: ["jpg", "png", "jpeg"],
                  public_id: `${Date.now()}-profile`,
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
            });
            profilePicUrl = result.secure_url;
          } catch (fallbackError) {
            console.warn(
              "Direct Cloudinary upload failed, using Google URL:",
              fallbackError.message
            );
          }
        } finally {
          // Clean up temporary file
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }

        if (!user) {
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName,
            username,
            email: profile.emails[0].value,
            profilePic: profilePicUrl,
          });
        } else {
          // Update fields if missing or outdated
          user.username = username; // Always update to email's local part
          user.fullName = profile.displayName;
          user.email = profile.emails[0].value;
          user.profilePic = profilePicUrl.includes("lh3.googleusercontent.com")
            ? profilePicUrl
            : user.profilePic || profilePicUrl;
        }

        // Save user to database with detailed error handling
        try {
          await user.save();
          console.log("User saved successfully:", user);
        } catch (saveError) {
          console.error("Error saving user to database:", saveError.message);
          throw new Error(`Failed to save user: ${saveError.message}`);
        }

        // Prepare limited user data
        const userData = {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
        };

        return done(null, { user, userData });
      } catch (error) {
        console.error("Error in Google OAuth Strategy:", error.message);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Error in deserializeUser:", error.message);
    done(error, null);
  }
});
