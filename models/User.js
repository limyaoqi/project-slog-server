const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["superAdmin", "admin", "user"],
    default: "user",
  },
  isOnline: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  lastActive: { type: Date },
  firstLogin: { type: Boolean, default: true },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
});

module.exports = mongoose.model("User", UserSchema);
