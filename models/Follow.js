const mongoose = require("mongoose");

const RelationshipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followings: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Relationship", RelationshipSchema);
