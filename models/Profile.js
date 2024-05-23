const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },

  avatar: { type: String },
  interests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tags" }],
});

module.exports = mongoose.model("Profile", ProfileSchema);
