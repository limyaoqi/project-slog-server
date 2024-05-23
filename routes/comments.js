const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const { auth } = require("../middleware/auth");
const Reply = require("../models/Reply");

//localhost:2000/comments/postId
router.post("/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.json({ msg: "Post not found" });
    }

    //find the comment user is same with the post owner
    let commentOwner = req.user._id;
    let postOwner = post.user;

    let comment = await Comment.create({
      content: req.body.content,
      post: req.params.id,
      user: req.user._id,
    });
    post.comments.push({ comment: comment._id });
    await post.save();

    if (commentOwner.toString() !== postOwner.toString()) {
      // Send notification to the post owner
      await Notification.create({
        type: "comment",
        content: `User ${req.user.username} commented on your post.`,
        recipient: postOwner,
        postId: post._id,
      });
    }

    return res.json({ comment, msg: "Comment added successfully" });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Cannot add a comment, Please try again later.",
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ msg: "Comment not found" });
    if (comment.user != req.user._id)
      return res.status(401).json({ msg: "You do not own this comment" });
    let deletedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );
    return res.json({ deletedComment, msg: "Comment deleted successfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, msg: "Something went wrong" });
  }
});

//update comment
router.put("/:id", auth, async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ msg: "Comment Not Found" });
    if (comment.user._id == req.user._id) {
      let updateComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updated_at: new Date().toISOString() },
        {
          new: true,
        }
      );

      return res.json({
        comment: updateComment,
        msg: "Comment succesfully updated.",
      });
      // comment.content = content || comment.content;
      // await comment.save();

      // return res.json({ comment, msg: "Comment updated successfully" });
    }
  } catch (e) {
    return res.json({
      error: e.message,
      msg: "You're not allowed to do this action",
    });
  }
});

//id is comment id
router.post("/:postId/:id/reply", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.json({ msg: "Comment not found" });
    }

    // The user replying to the comment
      let replyOwner = req.user._id;
    let commentOwner = comment.user;

    let reply = await Reply.create({
      content: req.body.content,
      user: replyOwner,
      parent_comment: comment,
    });

    comment.replies.push(reply._id);
    await comment.save();

    if (replyOwner.toString() !== commentOwner.toString()) {
      // Send notification to the post owner
      await Notification.create({
        type: "reply",
        content: `User ${req.user.username} replied your comment.`,
        recipient: commentOwner,
        postId: post._id,
      });
    }

    return res.json({ reply, msg: "Reply added successfully" });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Cannot add a comment, Please try again later.",
    });
  }
});

module.exports = router;
