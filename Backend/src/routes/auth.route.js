import express from "express";
import {
  signup,
  sendOtp,
  verifyOtp,
  login,
  logout,
  updateProfile,
  checkAuth,
  checkUsername,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/login", login);

router.get("/logout", protectRoute, logout);

router.post("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.get("/check-username", checkUsername);


export default router;
