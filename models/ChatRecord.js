const mongoose = require("mongoose");

const ChatRecordSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
});

module.exports = mongoose.model("ChatRecord", ChatRecordSchema);
