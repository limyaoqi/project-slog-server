const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  friendsCount: { type: Number, default: 0 },
  lastActive: { type: Date },
  firstLogin: { type: Boolean, default: true },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
});

module.exports = mongoose.model("User", UserSchema);
