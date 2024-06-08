const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    content: { type: String },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    //the user who reply the comment
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
    //the user who reply the user that reply this comment
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
