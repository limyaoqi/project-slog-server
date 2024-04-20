const mongoose = require("mongoose");

const ChatRecordSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chats: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: String, required: true },
      time: { type: Date, default: Date.now }
    }
  ],
  softCopy: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: String, required: true },
      time: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("ChatRecord", ChatRecordSchema);