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
      return res.json({ message: "Post not found" });
    }

    //find the comment user is same with the post owner
    let commentOwner = req.user._id;
    let postOwner = post.user;

    let comment = await Comment.create({
      content: req.body.content,
      post: req.params.id,
      user: req.user._id,
    });
    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    if (commentOwner.toString() !== postOwner.toString()) {
      // Send notification to the post owner
      const notice = new Notification({
        type: "comment",
        content: `User ${req.user.username} commented on your post.`,
        recipient: postOwner,
        createdBy: commentOwner,
        postId: post._id,
      });
      await notice.save();
    }

    return res.json({ comment, message: "Comment added successfully" });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      message: "Cannot add a comment, Please try again later.",
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate({
      path: "post",
      select: "user",
    });
    if (!comment) return res.json({ message: "Comment not found" });

    if (
      comment.post.user.toString() !== req.user._id.toString() &&
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "superAdmin" &&
      req.user.role !== "admin"
    )
      return res
        .status(401)
        .json({ message: "You are not allow to do this action" });

    await Comment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    return res.json({ message: "Comment deleted successfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Something went wrong" });
  }
});

//update comment
router.put("/:id", auth, async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ message: "Comment Not Found" });
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
        message: "Comment succesfully updated.",
      });
      // comment.content = content || comment.content;
      // await comment.save();

      // return res.json({ comment, message: "Comment updated successfully" });
    }
  } catch (e) {
    return res.json({
      error: e.message,
      message: "You're not allowed to do this action",
    });
  }
});

//id is comment id
router.post("/:postId/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.json({ message: "Comment not found" });
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
      }).save();
    }

    comment = await Comment.findById(req.params.id)
      .populate("user", "username")
      .populate({
        path: "replies",
        populate: {
          path: "user",
          select: "username",
        },
      });

    return res.json({ comment, message: "Reply added successfully" });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      message: "Cannot add a comment, Please try again later.",
    });
  }
});

module.exports = router;
