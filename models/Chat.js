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
  read: {
    type: Boolean,
    default: false,
  },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  chatRecord: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRecord" },
});

module.exports = mongoose.model("Chat", ChatSchema);
