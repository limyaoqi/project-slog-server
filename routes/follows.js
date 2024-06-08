const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const Follow = require("../models/Follow");

router.get("/followers", auth, async (req, res) => {
  try {
    const follow = await Follow.find({ user: req.user._id }).populate(
      "followers",
      "username"
    );
    if (!follow) return res.json({ message: "You dont have follower" });
    return res.json(follow.followers);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

router.get("/followings", auth, async (req, res) => {
  try {
    const follow = await Follow.find({ user: req.user._id }).populate(
      "followers",
      "username"
    );
    if (!follow) return res.json({ message: "You dont have follower" });
    return res.json(follow.followings);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

router.post("/:id", auth, async (req, res) => {
  try {
    let currentUserId = req.user._id;
    let userToFollowId = req.params.id;

    let currentUserFollowRecord = await Follow.findOne({ user: currentUserId });
    let userToFollowRecord = await Follow.findOne({ user: userToFollowId });

    if (!currentUserFollowRecord) {
      currentUserFollowRecord = await new Follow({
        user: currentUserId,
      }).save();
    }

    if (!userToFollowRecord) {
      userToFollowRecord = await new Follow({
        user: userToFollowId,
      }).save();
    }

    const isFollowing =
      currentUserFollowRecord.followings.includes(userToFollowId);

    if (isFollowing) {
      currentUserFollowRecord.followings =
        currentUserFollowRecord.followings.filter(
          (id) => id.toString() !== userToFollowId
        );
      userToFollowRecord.followers = userToFollowRecord.followers.filter(
        (id) => id.toString() !== currentUserId
      );
      await currentUserFollowRecord.save();
      await userToFollowRecord.save();
      return res
        .status(200)
        .json({ currentUserFollowRecord, message: "Unfollowed successfully" });
    } else {
      currentUserFollowRecord.followings.push(userToFollowId);
      userToFollowRecord.followers.push(currentUserId);
      await currentUserFollowRecord.save();
      await userToFollowRecord.save();
      return res
        .status(200)
        .json({ currentUserFollowRecord, message: "Followed successfully" });
    }
  } catch (e) {
    return res
      .status(400)
      .json({
        error: e.message,
        message: "Cannot get all follower and following",
      });
  }
});
module.exports = router;
