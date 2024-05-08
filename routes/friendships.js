const express = require("express");
const router = express.Router();
const Friendship = require("../models/Friendship");
const auth = require("../middleware/auth");
const path = require("path"); //allows you to change directors
const Notification = require("../models/Notification");

router.get("/friend", auth, async (req, res) => {
  const user = req.user._id;
  const Friends = await Friendship.find({
    $or: [{ user1: user }, { user2: user }],
    status: "accepted",
  });

  res.json({ Friends });
});

//get all the request
router.get("/request", auth, async (req, res) => {
  const user = req.user._id;
  const request = await Friendship.find({
    $or: [{ user1: user }, { user2: user }],
    status: "pending",  });

  res.json({ request });
});

//send request to user that want to add
router.post("/request/:id", auth, async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.id;

    //check is it yourself
    if (sender.toString() === receiver.toString()) {
      return res
        .status(400)
        .json({ msg: "Cannot send friend request to yourself" });
    }

    //try to find if you already is friend with him/you already sending request
    const alreadyIsFriend = await Friendship.findOne({
      $or: [
        { user1: sender, user2: receiver },
        { user1: receiver, user2: sender },
      ],
    });
    if (alreadyIsFriend.status === "pending") {
      return res.status(400).json({
        msg: "Friend request already sent",
      });
    } else if (alreadyIsFriend.status === "accepted") {
      return res.status(400).json({
        msg: "You and he are already friends",
      });
    }

    //send a request
    const friendshipRequest = new Friendship({
      user1: sender,
      user2: receiver,
      status: "pending",
    });
    await friendshipRequest.save();

    const notification = new Notification({
      type: "friend_request",
      content: `${req.user.fullname} sent you a friend request.`,
      recipient: receiver,
    });
    await notification.save();
    res.json({ friendshipRequest, msg: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// Accept friend request
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.id;

    //find the friendship
    const friendshipRequest = Friendship.findOne({
      _id: friendshipId,
      receiver: userId,
    });

    if (!friendshipRequest) {
      return res.status(404).json({ msg: "Friendship not found" });
    }
    friendshipRequest.status = "accepted";
    const friendship = await friendshipRequest.save();

    const notification = new Notification({
      type: "friend_request_accept",
      content: `${req.user.fullname} accepted your friend request.`,
      recipient: friendshipRequest.user1,
    });
    await notification.save();

    res.json({
      friendship,
      msg: "Friend request accepted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Reject friend request
router.post("/reject/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.id;

    // Check if friendship exists and user is involved
    const friendshipRequest = Friendship.findOne({
      _id: friendshipId,
      receiver: userId,
    });
    if (!friendshipRequest) {
      return res.status(404).json({ msg: "Friendship not found" });
    }

    // Delete friendship
    await Friendship.findByIdAndDelete(friendshipId);

    res.json({ msg: "Friend request rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Unfriend user
router.post("/unfriend/:friendshipId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.friendshipId;

    // Check if friendship exists and user is involved
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      $or: [{ user1: userId }, { user2: userId }],
      status: "accepted",
    });
    if (!friendship) {
      return res.status(404).json({ msg: "Friendship not found" });
    }

    // Delete friendship
    await Friendship.findByIdAndDelete(friendshipId);

    res.json({ msg: "Unfriended successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
