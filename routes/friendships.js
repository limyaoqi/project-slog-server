const express = require("express");
const router = express.Router();
const Friendship = require("../models/Friendship");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Send friend request
// router.post("/request/:userId", auth, async (req, res) => {
//   try {
//     const senderId = req.user._id;
//     const receiverId = req.params.userId;

//     // Cannot send request to yourself
//     if (senderId.toString() === receiverId.toString()) {
//       return res.status(400).json({ msg: "Cannot send friend request to yourself" });
//     }

//     // Find from friendshipSchema whether you already is friend or not
//     const alreadyFriendship = await Friendship.findOne({
//       $or: [
//         { user1: senderId, user2: receiverId },
//         { user1: receiverId, user2: senderId }
//       ]
//     });
//     if (alreadyFriendship) {
//       return res.status(400).json({ msg: "Friend request already sent or friendship already exists" });
//     }

//     // So if not friend can send the request
//     const friendshipRequest = new Friendship({
//       user1: senderId,
//       user2: receiverId,
//       status: 'pending'
//     });
//     await friendshipRequest.save();

//     res.json({ msg: "Friend request sent successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Server Error" });
//   }
// });

router.post("/request/:id", auth, async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.id;

    //check is yourself
    if (sender.toString() === receiver.toString()) {
      return res
        .status(400)
        .json({ msg: "Cannot send friend request to yourself" });
    }

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

    const friendshipRequest = new Friendship({
      user1: sender,
      user2: receiver,
      status: "pending",
    });
    await friendshipRequest.save();
    res.json({ friendshipRequest, msg: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// Accept friend request
router.post("/accept/:friendshipId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.friendshipId;

    // check from friendshipSchema is that got this request?
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      $or: [{ user1: userId }, { user2: userId }],
    });
    if (!friendship) {
      return res.status(404).json({ msg: "Friendship not found" });
    }

    // Update friendship status to accepted
    friendship.status = "accepted";
    await friendship.save();

    res.json({ msg: "Friend request accepted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Reject friend request
router.post("/reject/:friendshipId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.friendshipId;

    // Check if friendship exists and user is involved
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      $or: [{ user1: userId }, { user2: userId }],
    });
    if (!friendship) {
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
