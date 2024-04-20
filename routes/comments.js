const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

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
    let post = await Post.findByIdAndUpdate(
      comment.post,
      { $pull: { comments: { comment: { _id: req.params.id } } } },
      { new: true }
    );
    await Comment.findByIdAndDelete(req.params.id);
    return res.json({ post, msg: "Comment deleted successfully" });
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
      // let updateComment = await Comment.findByIdAndUpdate(
      //   req.params.id,
      //   { ...req.body, updated_at: new Date().toISOString() },
      //   {
      //     new: true,
      //   }
      // );
      // return res.json({ comment: updateComment, msg: "Comment succesfully updated." });
      comment.content = content || comment.content;
      await comment.save();

      return res.json({ comment, msg: "Comment updated successfully" });
    }
  } catch (e) {
    return res.json({
      error: e.message,
      msg: "You're not allowed to do this action",
    });
  }
});
module.exports = router;
