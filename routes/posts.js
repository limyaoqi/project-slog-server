const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Tags = require("../models/Tags");
const { auth } = require("../middleware/auth");
const multer = require("multer"); //handle file upload
const fs = require("fs"); //allows you to read and write on the file system
const path = require("path"); //allows you to change directors

//store the image to public file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public");
  }, //where to save the images
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + path.extname(file.originalname));
  }, //format the filename before storing it
});

// Configure Multer
const upload = multer({ storage });

//add a new post
router.post("/", auth, upload.array("attachments", 9), async (req, res) => {
  try {
    // if (!req.files || req.files.length === 0) {
    //   return res.status(400).json({ error: "No files were uploaded" });
    // }

    //title must have but less than 100 word
    if (req.body.title.length > 100) {
      return res.status(400).json({
        error: "Title length should be less than or equal to 100 characters",
      });
    }

    //description must less than 100 word
    if (req.body.description.length > 500) {
      return res.status(400).json({
        error:
          "Description length should be less than or equal to 500 characters",
      });
    }

    //in default i set to public if the user didnt set but to prevent the visibility is not the thing i set a error2
    if (
      req.body.visibility &&
      !["public", "private"].includes(req.body.visibility)
    ) {
      return res.status(400).json({ error: "Invalid visibility value" });
    }

    //in default i set to draft(edit) if the user didnt set but to prevent the visibility is not the thing i set a error
    if (
      req.body.status &&
      !["draft", "published", "archived"].includes(req.body.status)
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const tags = req.body.tags;
    let tagIdArray = [];
    if (tags && tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        const tag = await Tags.findOne({ name: tags[i] });
        if (tag) {
          tagIdArray.push(tag.id);
        } else {
          const newTag = new Tags({
            name: tags[i],
          });
          const tag = await newTag.save();
          tagIdArray.push(tag.id);
        }
      }
    }

    const attachments = req.files.map((file) => file.filename);

    const post = new Post({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      user: req.user._id,
      tags: tagIdArray.map((tag) => tag),
      attachments: attachments,
      visibility: req.body.visibility || "public",
      status: req.body.status || "draft",
    });
    await post.save();
    return res.json({ post, msg: "Post added succesfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, msg: "Failed to add a post" });
  }
});

router.get("/", async (req, res) => {
  try {
    //this to get all the key from url
    const keys = Object.keys(req.query);
    let filter = {};
    //set the key and the value to filter
    keys.forEach((key) => {
      filter[key] = req.query[key];
    });
    const posts = await Post.find(filter)
      .populate({
        path: "user",
        select: "fullname,username",
      })
      .populate({
        path: "comments",
        select: "-__v",
      })
      .populate({
        path: "likes",
      });
    return res.json(posts);
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, msg: "Cannot get all post" });
  }
});

//get the post ny its ID
router.get("/:id", async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "fullname username",
      })
      .populate({
        path: "comments",
        select: "-__v",
      })
      .populate({
        path: "likes",
      });
    if (!post) return res.json({ msg: "Post Not Found" });
    return res.json(post);
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Something went wrong, Please try again later.",
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.json({ msg: "Post Not Found" });
    if (post.user != req.user._id) {
      res.status(401).json({ msg: "You do not own this post" });
    }
    // if (post.attachments) {
    //   const filename = post.attachments;
    //   const filepath = path.join(__dirname, "../public/" + filename);
    //   fs.unlinkSync(filepath);
    // }
    if (post.attachments && post.attachments.length > 0) {
      // Loop through each filename in the attachments array
      post.attachments.forEach((filename) => {
        // Construct the file path
        const filepath = path.join(__dirname, "../public/" + filename);

        // Delete the file
        fs.unlinkSync(filepath);
      });
    }
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    return res.json({ msg: "Post succesfully deleted." });
  } catch (e) {
    return res
      .status(401)
      .json({ error: e.message, msg: "You're not allowed to do this action" });
  }
});

router.put("/:id", auth, upload.array("attachments", 9), async (req, res) => {
  try {
    // Find the post by ID
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Update post fields
    post.title = req.body.title || post.title;
    post.description = req.body.description || post.description;
    post.tags = req.body.tags || post.tags;
    post.visibility = req.body.visibility || post.visibility;
    post.status = req.body.status || post.status;

    // Update attachments if new files were uploaded
    if (req.files && req.files.length > 0) {
      // Delete existing attachments
      if (post.attachments && post.attachments.length > 0) {
        post.attachments.forEach((filename) => {
          const filepath = path.join(__dirname, "../public/" + filename);
          fs.unlinkSync(filepath);
        });
      }
      // Store new attachment filenames
      post.attachments = req.files.map((file) => file.filename);
    }

    // Save the updated post
    await post.save();

    return res.json({ post, msg: "Post updated successfully" });
  } catch (e) {
    return res.json({
      error: e.message,
      msg: "You're not allowed to do this action",
    });
  }
});
module.exports = router;
