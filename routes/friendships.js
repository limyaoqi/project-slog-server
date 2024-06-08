const express = require("express");
const router = express.Router();
const Friendship = require("../models/Friendship");
const { auth } = require("../middleware/auth");
const path = require("path"); //allows you to change directors
const Notification = require("../models/Notification");
const User = require("../models/User");

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const search = req.query.search || ""; // Default to an empty string if search is not provided

    // Build the search regex
    const searchRegex = new RegExp(search, "i"); // 'i' makes it case-insensitive

    // Find friends
    let friends = await Friendship.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: "accepted",
    })
      .populate({
        path: "user1",
        select: "-password",
        populate: {
          path: "profileId",
          select: "avatar",
        },
      })
      .populate({
        path: "user2",
        select: "-password",
        populate: {
          path: "profileId",
          select: "avatar",
        },
      });

    // Filter friends based on the search query
    if (search) {
      friends = friends.filter((friend) => {
        if (friend.user1._id.toString() === req.user._id) {
          const user2Match = searchRegex.test(friend.user2.username);
          return user2Match;
        } else {
          const user1Match = searchRegex.test(friend.user1.username);
          return user1Match;
        }
      });
    }

    // Sort friends based on online status
    friends.sort((a, b) => {
      const aIsOnline =
        a.user1._id.toString() === userId ? a.user2.isOnline : a.user1.isOnline;
      const bIsOnline =
        b.user1._id.toString() === userId ? b.user2.isOnline : b.user1.isOnline;
      return bIsOnline - aIsOnline;
    });

    return res.json(friends);
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

//get all the request
router.get("/request", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const request = await Friendship.find({
      user2: user,
      status: "pending",
    }).populate({
      path: "user1",
      select: "username",
      populate: {
        path: "profileId",
        select: "avatar",
      },
    });

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const findUser = req.params.id;
    const Friends = await Friendship.findOne({
      $or: [
        { user1: user, user2: findUser },
        { user1: findUser, user2: user },
      ],
    });

    return res.json(Friends);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
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
        .json({ message: "Cannot send friend request to yourself" });
    }

    const userFound = await User.findById(receiver);

    if (!userFound) {
      return res.status(400).json({
        message: "Cannot find the user",
      });
    }

    //try to find if you already is friend with him/you already sending request
    const alreadyIsFriend = await Friendship.findOne({
      $or: [
        { user1: sender, user2: receiver },
        { user1: receiver, user2: sender },
      ],
    });
    if (alreadyIsFriend) {
      if (alreadyIsFriend.status === "pending") {
        return res.status(400).json({
          message: "Friend request already sent",
        });
      } else if (alreadyIsFriend.status === "accepted") {
        return res.status(400).json({
          message: "You and he are already friends",
        });
      }
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
      content: `${req.user.username} sent you a friend request.`,
      recipient: receiver,
      createdBy: sender,
    });
    await notification.save();
    return res.json({
      friendshipRequest,
      message: "Friend request sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendshipId = req.params.id;

    //find the friendship
    const friendshipRequest = await Friendship.findById(friendshipId);

    if (!friendshipRequest) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    if (friendshipRequest.user2.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this friendship request",
      });
    }

    const friendship = await Friendship.findByIdAndUpdate(
      friendshipId,
      { status: "accepted" },
      { new: true }
    );

    const notification = new Notification({
      type: "friend_request_accept",
      content: `${req.user.username} accepted your friend request.`,
      recipient: friendshipRequest.user1,
      createdBy: userId,
    });
    await notification.save();

    return res.json({
      friendship,
      message: "Friend request accepted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
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
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Delete friendship
    await Friendship.findByIdAndDelete(friendshipId);

    return res.json({ message: "Friend request rejected successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
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
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Delete friendship
    await Friendship.findByIdAndDelete(friendshipId);

    return res.json({ message: "Unfriended successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
