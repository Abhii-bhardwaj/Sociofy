import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

const capitalizeFullName = (fullName) => {
  return fullName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Generate random 4-character suffix
const generateRandomSuffix = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Alphanumeric pool
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * characters.length)); // Random char
  }
  return suffix; // e.g., "X7K9"
};

// Generate unique username from fullName with random suffix
const generateUniqueUsernameFromFullName = async (fullName) => {
  const baseUsername = fullName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(""); // e.g., "Abhi Bhardwaj" → "AbhiBhardwaj"
  let username = baseUsername;

  // Check if base username is taken
  while (await User.findOne({ username })) {
    username = `${baseUsername}${generateRandomSuffix()}`; // Add random suffix, e.g., "AbhiBhardwajX7K9"
  }
  return username;
};

export const signup = async (req, res) => {
  console.log("Received Signup Request:", req.body);
  const { fullName, email, password, username, dob } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found. Please verify OTP first" });
    }

    // Capitalize fullName
    const capitalizedFullName = capitalizeFullName(fullName);

    // Check and set username
    let finalUsername;
    if (username && username.trim() !== "") {
      // Check if username is provided and not empty
      if (await User.findOne({ username })) {
        finalUsername = await generateUniqueUsernameFromFullName(
          capitalizedFullName
        ); // Suggest if taken
      } else {
        finalUsername = username; // Use provided username if available
      }
    } else {
      finalUsername = await generateUniqueUsernameFromFullName(
        capitalizedFullName
      ); // Generate if not provided
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.fullName = capitalizedFullName;
    user.username = finalUsername;
    user.password = hashedPassword;
    user.profilePic = req.file?.path || user.profilePic; // Use existing pic if not provided
    user.dob = new Date(dob);
    user.isOtpVerified = false; // Reset OTP verified status after signup

    // Set profilePic: Use uploaded file or default from public folder
    const profilePic = req.file?.path || "/public/placeholder.jpeg";
    console.log("Setting profilePic to:", profilePic); // Debug log

    await user.save();

    await generateToken(user._id, res);

    const userData = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      dob: user.dob,
      profilePic: profilePic,
    };
    await redis.set(`user:${user._id}`, JSON.stringify(userData), {
      EX: 60 * 60,
    });

    const { password: _, ...userWithoutPassword } = user._doc;

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkUsername = async (req, res) => {
  const { username } = req.query; // Get username from query params

  try {
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ username });
    if (user) {
      return res
        .status(200)
        .json({ available: false, message: "Username is already taken" });
    }

    res.status(200).json({ available: true, message: "Username is available" });
  } catch (error) {
    console.log("Error in checkUsername", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    // Prevent frequent OTP requests (cooldown period of 1 minute)
    const lastOtpTime = user.otp?.requestedAt;
    if (lastOtpTime && Date.now() - lastOtpTime < 60 * 1000) {
      return res
        .status(429)
        .json({ message: "Please wait before requesting a new OTP." });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Hash OTP securely
    const hashedOtp = await bcrypt.hash(otp, 8);

    // Save OTP & timestamp
    user.otp = {
      value: hashedOtp,
      expiration: expirationTime,
      requestedAt: Date.now(),
    };
    await user.save();

    console.log(`Sending OTP: ${otp} to email: ${email}`);

    res
      .status(200)
      .json({ message: "OTP is being sent. Please check your email." });

    // Send OTP asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
        });
        console.log(`OTP Email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError.message);
      }
    });
  } catch (error) {
    console.log("Error sending OTP", error.message);
    res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again later." });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.value) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otp.expiration) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp.value);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.isOtpVerified = true;
    user.otp = { value: null, expiration: null }; // Clear OTP after verification
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log("Error verifying OTP", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = await generateToken(user._id, res); // ✅ Await add kiya

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password; // ✅ Safe tarika se password hata diya

    await redis.set(`user:${user._id}`, JSON.stringify(userWithoutPassword), {
      EX: 10 * 60, // 10 minutes cache
    });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Check if username is available



export const logout = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ Redis se token aur user data remove karo
    await redis.del(`token:${userId}`);
    await redis.del(`user:${userId}`);

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV !== "development",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    //updating chache memory.
    const { password: _, ...updatedUserWithoutPassword } = updatedUser._doc;
    await redis.set(
      `user:${userId}`,
      JSON.stringify(updatedUserWithoutPassword),
      { EX: 10 * 60 }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
    console.log(JSON.stringify(decoded));

    const userId = decoded.userId;

    // ✅ First, Check Redis Cache
    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    // ⏳ If Not in Cache, Fetch from DB
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Store in Redis for Future Fast Access
    await redis.set(`user:${userId}`, JSON.stringify(user), {
      EX: 60 * 60, // Cache for 1 hour
    });

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in checkAuth", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
