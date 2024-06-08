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

router.get("/", auth, async (req, res) => {
  try {
    const keys = Object.keys(req.query);
    let filter = {};
    keys.forEach((key) => {
      filter[key] = req.query[key];
    });

    // filter = {
    //   ...filter,
    //   visibility: { $ne: "private" }, // Exclude private posts
    //   status: { $nin: ["draft", "archived"] }, // Exclude draft and archived posts
    // };

    const posts = await Post.find(filter)
      .populate({
        path: "user",
        select: "username",
        populate: {
          path: "profileId",
          select: "avatar",
        },
      })
      .populate({
        path: "comments",
        select: "-__v",
        populate: [
          {
            path: "user",
            select: "username",
            populate: {
              path: "profileId",
              select: "avatar",
            },
          },
          {
            path: "replies",
            select: "-__v",
            populate: {
              path: "user",
              select: "username",
              populate: {
                path: "profileId",
                select: "avatar",
              },
            },
          },
        ],
      })
      .populate({
        path: "tags",
        select: "name",
      });

    const filteredDeletedPosts = posts.filter((post) => !post.isDeleted);

    const filteredCommentDeletedPosts = filteredDeletedPosts.map((post) => {
      post.comments = post.comments.filter((comment) => !comment.isDeleted);
      return post;
    }); // console.log(filteredDeletedPosts);

    // post.user._id === req.user._id return all the post that post.user._id !== req.user._id && status ==="published" visibility ==="public" and post.user._id === req.user._id
    const filteredPosts = filteredCommentDeletedPosts.filter((post) => {
      return (
        post.user._id.toString() === req.user._id.toString() ||
        (post.status === "published" && post.visibility === "public")
      );
    });

    return res.json(filteredPosts);
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Cannot get all post" });
  }
});

//get the post ny its ID
router.get("/:id", async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "username",
        populate: {
          path: "profileId",
          select: "avatar",
        },
      })
      .populate({
        path: "comments",
        select: "-__v",
        populate: [
          {
            path: "user",
            select: "username",
            populate: {
              path: "profileId",
              select: "avatar",
            },
          },
          {
            path: "replies",
            select: "-__v",
            populate: {
              path: "user",
              select: "username",
              populate: {
                path: "profileId",
                select: "avatar",
              },
            },
          },
        ],
      })
      .populate({
        path: "tags",
        select: "name",
      });
    if (!post) return res.json({ message: "Post Not Found" });

    post.comments = post.comments.filter((comment) => !comment.isDeleted);

    // if (!filteredPosts) return res.json({ message: "Post Not Found" });

    return res.json(post);
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      message: "Something went wrong, Please try again later.",
    });
  }
});

router.post("/", auth, upload.array("attachments", 9), async (req, res) => {
  try {
    // if (!req.files || req.files.length === 0) {
    //   return res.status(400).json({ error: "No files were uploaded" });
    // }

    //title must have but less than 100 word
    if (req.body.title.length > 100) {
      return res.status(400).json({
        message: "Title length should be less than or equal to 100 characters",
      });
    }

    //description must less than 100 word
    if (req.body.description.length > 500) {
      return res.status(400).json({
        message:
          "Description length should be less than or equal to 500 characters",
      });
    }

    //in default i set to public if the user didnt set but to prevent the visibility is not the thing i set a message2
    if (
      req.body.visibility &&
      !["public", "private"].includes(req.body.visibility)
    ) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    //in default i set to draft(edit) if the user didnt set but to prevent the visibility is not the thing i set a message
    if (
      req.body.status &&
      !["draft", "published", "archived"].includes(req.body.status)
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const tags = req.body.tags || [];
    let tagIdArray = [];

    // Check if tags is an array
    if (Array.isArray(tags)) {
      // Iterate over the tags array
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].length > 0) {
          // Check for non-empty tag name
          const existingTag = await Tags.findOne({ name: tags[i] });
          if (existingTag) {
            tagIdArray.push(existingTag.id);
          } else {
            const newTag = new Tags({
              name: tags[i],
            });
            const savedTag = await newTag.save();
            tagIdArray.push(savedTag.id);
          }
          console.log(tags[i]);
        }
      }
    } else {
      const existingTag = await Tags.findOne({ name: tags });
      if (existingTag) {
        tagIdArray.push(existingTag.id);
      } else {
        const newTag = new Tags({
          name: tags,
        });
        const savedTag = await newTag.save();
        tagIdArray.push(savedTag.id);
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
    return res.json({ post, message: "Post added succesfully" });
  } catch (e) {
    return res
      .status(400)
      .json({ error: e.message, message: "Failed to add a post" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.json({ message: "Post Not Found" });

    if (
      post.user.toString() !== req.user._id &&
      req.user.role !== "superAdmin" &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "You are not allow to do this action" });
    }

    // if (post.attachments) {
    //   const filename = post.attachments;
    //   const filepath = path.join(__dirname, "../public/" + filename);
    //   fs.unlinkSync(filepath);
    // }
    // if (post.attachments && post.attachments.length > 0) {
    //   // Loop through each filename in the attachments array
    //   post.attachments.forEach((filename) => {
    //     // Construct the file path
    //     const filepath = path.join(__dirname, "../public/" + filename);

    //     // Delete the file
    //     fs.unlinkSync(filepath);
    //   });
    // }
    // await Post.findByIdAndDelete(req.params.id);
    // await Comment.deleteMany({ post: req.params.id });
    post.isDeleted = true;
    await post.save();
    return res.json({ message: "Post succesfully deleted." });
  } catch (e) {
    return res.status(401).json({
      error: e.message,
      message: "You're not allowed to do this action",
    });
  }
});

router.put("/:id", auth, upload.array("attachments", 9), async (req, res) => {
  try {
    // Find the post by ID to check if it exists
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Prepare the update object
    let updateData = {
      title: req.body.title || post.title,
      description: req.body.description || post.description,
      visibility: req.body.visibility || post.visibility,
      status: req.body.status || post.status,
    };

    // Handle tags

    let tagIdArray = [];
    const tags = req.body.tags || [];

    if (tags) {
      // Convert tags to array if it's a string
      const tagsArray = Array.isArray(tags) ? tags : [tags];

      // Iterate over the tags array
      for (let i = 0; i < tagsArray.length; i++) {
        if (tagsArray[i].length > 0) {
          // Check for non-empty tag name
          const existingTag = await Tags.findOne({ name: tagsArray[i] });
          if (existingTag) {
            tagIdArray.push(existingTag._id);
          } else {
            const newTag = new Tags({ name: tagsArray[i] });
            const savedTag = await newTag.save();
            tagIdArray.push(savedTag._id);
          }
        }
      }

      // Add tags to the update data
      updateData.tags = tagIdArray;
    }

    // Update attachments if new files were uploaded
    if (req.files && req.files.length > 0) {
      // Delete existing attachments
      if (post.attachments && post.attachments.length > 0) {
        post.attachments.forEach((filename) => {
          const filepath = path.join(__dirname, "../public/" + filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        });
      }
      // Store new attachment filenames
      updateData.attachments = req.files.map((file) => file.filename);
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("tags", "name"); // Populate tags if needed

    return res.json({
      post: updatedPost,
      message: "Post updated successfully",
    });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      message: "You're not allowed to do this action",
    });
  }
});
module.exports = router;
