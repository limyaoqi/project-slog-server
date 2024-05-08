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
  website: {
    type: String,
    default: "", 
  },
  avatar: [String],
  interests: [String], 
});

module.exports = mongoose.model("Profile", ProfileSchema);
