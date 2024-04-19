const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  isAdmin: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  followers: [
    {
      follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      _id: false,
    },
  ],
  followings: [
    {
      following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      _id: false,
    },
  ],
  friendsCount: { type: Number, default: 0 },
  lastActive: { type: Date },
});

module.exports = mongoose.model("User", UserSchema);
