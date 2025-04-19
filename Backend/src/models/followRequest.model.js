import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "canceled"],
    default: "pending",
    index: true, // Faster queries
  },
  mutualFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }], // Optional for better recommendation

},
{timestamps: true});

const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

export default FollowRequest;
