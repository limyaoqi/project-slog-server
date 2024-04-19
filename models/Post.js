const mongoose = require("mongoose")

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comments: [
      {
        comment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
        _id: false,
      },
    ],
    likes: [
      {
        liker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Like",
        },
        _id: false,
      },
    ],
    tags: [String],
    attachments: [String],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  }, 
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Indexes for frequently queried or sorted fields
PostSchema.index({ user: 1 }); // Index for user field
PostSchema.index({ createdAt: -1 }); // Index for createdAt field

PostSchema.pre("remove", { document: true }, async function (next) {
  try {
    // Remove all associated comments when a post is removed
    await this.model("Comment").deleteMany({ _id: { $in: this.comments } });
    next(); // Call next to continue with the remove operation
  } catch (error) {
    console.error("Error removing associated comments:", error);
    next(error); // Pass error to continue with the remove operation and handle it elsewhere
  }
});

module.exports = mongoose.model("Post", PostSchema);
