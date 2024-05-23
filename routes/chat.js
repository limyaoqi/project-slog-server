// Send Message (POST /api/chats)
// Get Chat History (GET /api/chats/:userId)
// Delete Chat (DELETE /api/chats/:id)

const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const Chat = require("../models/Chat");
const ChatRecord = require("../models/ChatRecord");
const Friendship = require("../models/Friendship");

// router.get("/", auth, async (req, res) => {
//   try {
//     const user = req.user._id;

//     const allFriend = await Friendship.find({
//       $or: [{ user1: user }, { user2: user }],
//       status: "accepted",
//     });

//     if (!allFriend || allFriend.length === 0) {
//       return res.status(400).json({ msg: "No friends found" });
//     }

//     let chatRecord = await ChatRecord.find({
//       $or: [{ user1: user }, { user2: user }],
//     });

//     if (!chatRecord) {
//       chatRecord = await new ChatRecord({
//         user1: user,
//         user2: receiver,
//         chats: [],
//       }).save();
//     }

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.get("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const receiver = req.params.id;

    const isFriend = await Friendship.findOne({
      $or: [
        { user1: user, user2: receiver },
        { user1: receiver, user2: user },
      ],
      status: "accepted",
    });

    if (!isFriend) {
      return res.status(400).json({ msg: "You are not receiver's friends" });
    }

    const chatRecord = await ChatRecord.findOne({
      $or: [
        { user1: user, user2: receiver },
        { user1: receiver, user2: user },
      ],
    }).populate("chats");

    if (!chatRecord) {
      return res.status(200).json({ msg: "Start a new message" });
    }

    return res.status(200).json({ chatRecord });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const receiver = req.params.id;
    const content = req.body.content;

    const isFriend = await Friendship.findOne({
      $or: [
        { user1: user, user2: receiver },
        { user1: receiver, user2: user },
      ],
      status: "accepted",
    });

    if (!isFriend) {
      return res.status(400).json({ msg: "You are not receiver's friends" });
    }

    let chatRecord = await ChatRecord.findOne({
      $or: [
        { user1: user, user2: receiver },
        { user1: receiver, user2: user },
      ],
    });

    if (!chatRecord) {
      chatRecord = await new ChatRecord({
        user1: user,
        user2: receiver,
        chats: [],
      }).save();
    }

    const chat = new Chat({
      sender: user,
      receiver: receiver,
      content: content,
      chatRecord: chatRecord._id,
    });

    await chat.save();

    chatRecord.chats.push(chat._id);
    await chatRecord.save();

    return res.status(200).json({ chat, message: "Message sent successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const chatroomId = req.params.id;

    const chat = await Chat.findById(chatroomId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.sender === user || chat.receiver === user) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!chat.deletedBy.includes(user)) {
      chat.deletedBy.push(user);
      await chat.save();
    }

    return res.status(200).json({ message: "Chat deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const sender = req.params.id;

    const isFriend = await Friendship.findOne({
      $or: [
        { user1: user, user2: sender },
        { user1: sender, user2: user },
      ],
      status: "accepted",
    });

    if (!isFriend) {
      return res.status(400).json({ message: "You are not sender's friend" });
    }

    const result = await Chat.updateMany(
      { sender: sender, receiver: user, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ message: "Messages marked as read", result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
