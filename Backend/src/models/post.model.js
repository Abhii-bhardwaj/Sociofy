import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This will refer to the User Model
    required: true,
  },
  postImage: [
    {
      url: { type: String, required: true },
      public_id: { type: String }, // For Cloudinary if you use
    },
  ],
  caption: {
    type: String,
    trim: true,
  },
  likes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      likedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  shares: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  save: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      savedAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  tags: [
    {
      type: String,
    },
  ],
  location: {
    type: String,
    trim: true,
  },
  visibility: {
    type: String,
    enum: ["Public", "Friends Only", "Private"],
    default: "Public",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);
export default Post;
