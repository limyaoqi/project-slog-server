//user1, user2, content, time,

const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", ChatSchema);
