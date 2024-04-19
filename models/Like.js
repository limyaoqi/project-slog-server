const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: "User" },
  post: { type: mongoose.Schema.Types.ObjectId, required: "Post" },
  created_at: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("Like", LikeSchema);
