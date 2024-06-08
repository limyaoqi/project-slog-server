const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const { auth } = require("../middleware/auth");
const Reply = require("../models/Reply");
const Comment = require("../models/Comment");

//localhost:8000/likes/postId
//like and unlike
router.post("/post/:id", auth, async (req, res) => {
  try {
    // Find the post using the URL ID
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the user has already liked the post
    const alreadyLikedIndex = post.likes.findIndex(
      (like) => like.toString() === req.user._id.toString()
    );

    if (alreadyLikedIndex === -1) {
      // If not liked, push the user ID to the likes array
      post.likes.push(req.user._id);
      await post.save();
      return res.json({ post, message: "Liked the post." });
    } else {
      // If already liked, remove the like
      post.likes.splice(alreadyLikedIndex, 1);
      await post.save();
      return res.json({ post, message: "Unliked the post." });
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Cannot process the request" });
  }
});

router.post("/comment/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    console.log(comment);

    const alreadyLikedIndex = comment.likes.findIndex(
      (like) => like.toString() === req.user._id.toString()
    );

    if (alreadyLikedIndex === -1) {
      comment.likes.push(req.user._id);
      await comment.save();
      return res.json({ comment, message: "Liked the comment." });
    } else {
      comment.likes.splice(alreadyLikedIndex, 1);
      await comment.save();
      return res.json({ comment, message: "Unliked the comment." });
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Cannot process the request" });
  }
});

router.post("/reply/:id", auth, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    const alreadyLikedIndex = reply.likes.findIndex(
      (like) => like.toString() === req.user._id.toString()
    );

    if (alreadyLikedIndex === -1) {
      reply.likes.push(req.user._id);
      await reply.save();
      return res.json({ reply, message: "Liked the reply." });
    } else {
      reply.likes.splice(alreadyLikedIndex, 1);
      await reply.save();
      return res.json({ reply, message: "Unliked the reply." });
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Cannot process the request" });
  }
});

module.exports = router;
