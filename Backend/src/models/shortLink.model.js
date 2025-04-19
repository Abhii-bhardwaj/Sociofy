// models/ShortLink.js
import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, unique: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  createdAt: { type: Date, default: Date.now, expires: "30d" }, // Optional: expires in 30 days
});

const ShortLink = mongoose.model("ShortLink", shortLinkSchema);

export default ShortLink;