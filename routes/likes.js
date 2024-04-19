const express = require("express");
const router = express.Router();
const Like = require("../models/Like");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

//localhost:8000/likes/postId
router.post("/:id", auth, async (req, res) => {
  try {
    //find the post using the url id
    let post = await Post.findById(req.params.id);
    if (!post) return res.json({ msg: "Post not found" });

    //find from the like schema to ensure whether already like the post or not
    let like = await Like.findOne({ user: req.user._id, post: req.params.id });

    //if dont have like the post will create a like
    if (!like) {
      let liker = await Like.create({
        post: req.params.id,
        user: req.user._id,
      });
      post.likes.push({ liker: liker.user });
      await post.save();
      return res.json({ post, msg: "like a post." });
    } else {
      //if already like will change to unlike
      let post = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            likes: { liker: { _id: req.user._id, post: req.params.id } },
          },
        },
        { new: true }
      );
      await Like.findOneAndDelete({ user: req.user._id, post: req.params.id });
      return res.json({ post, msg: "unlike a post." });
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, msg: "Cannot get all post" });
  }
});

module.exports = router;
