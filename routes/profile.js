const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");
const multer = require("multer");
const { auth, existingProfile } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");
const Tags = require("../models/Tags");
const Post = require("../models/Post");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "avatar/");
  }, //where to save the images
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }, //format the filename before storing it
});

const upload = multer({ storage });

//get your profile
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userProfile = await Profile.findOne({ user: userId })
      .populate({
        path: "user",
        select: "username",
      })
      .populate("interests");
    if (!userProfile) return res.json({ msg: "Profile Not Found" });
    const userPosts = await Post.find({ user: userId })
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
        path: "likes",
      })
      .populate({
        path: "tags",
        select: "name",
      });
    return res.json({ profile: userProfile, posts: userPosts });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Something went wrong, Please try again later.",
    });
  }
});

//get the user profile that you find
router.get("/:id", auth, async (req, res) => {
  try {
    const user = req.params.id;
    const userProfile = await Profile.findOne({ user: user })
      .populate({
        path: "user",
        select: "username",
      })
      .populate("interests");
    if (!userProfile) return res.json({ msg: "Profile Not Found" });
    const userPosts = await Post.find({ user })
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
        path: "likes",
      })
      .populate({
        path: "tags",
        select: "name",
      });

    return res.json({ profile: userProfile, posts: userPosts });
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Something went wrong, Please try again later.",
    });
  }
});

//post the profile when you first login
router.post(
  "/",
  auth,
  existingProfile, //check whether you already existing the profile bcs we only want to set the profile when we first login
  upload.single("avatar"),
  async (req, res) => {
    try {
      const user = req.user._id;
      const bio = req.body.bio;
      const location = req.body.location;
      const interests = req.body.interests;
      const avatar = req.file ? req.file.filename : "default_avatar.jpg";

      let tagIdArray = [];

      if (Array.isArray(interests)) {
        // Iterate over the interests array
        for (let i = 0; i < interests.length; i++) {
          if (interests[i].length > 0) {
            // Check for non-empty tag name
            const existingTag = await Tags.findOne({ name: interests[i] });
            if (existingTag) {
              tagIdArray.push(existingTag.id);
            } else {
              const newTag = new Tags({
                name: interests[i],
              });
              const savedTag = await newTag.save();
              tagIdArray.push(savedTag.id);
            }
          }
        }
      } else {
        const existingTag = await Tags.findOne({ name: interests });
        if (existingTag) {
          tagIdArray.push(existingTag.id);
        } else {
          const newTag = new Tags({
            name: interests,
          });
          const savedTag = await newTag.save();
          tagIdArray.push(savedTag.id);
        }
      }

      const profile = new Profile({
        user,
        bio,
        location,
        interests: tagIdArray,
        avatar,
      });

      await profile.save();

      await User.findByIdAndUpdate(user, {
        firstLogin: false,
        profileId: profile._id,
      });

      return res.json({ profile, msg: "Profile added successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
);

router.put("/:id", auth, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user._id;
    const userProfileId = req.params.id;

    let userProfile = await Profile.findById(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ msg: "Profile Not Found" });
    }
    if (userProfile.user.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const bio = req.body.bio;
    const location = req.body.location;
    let interests = req.body.interests;

    let tagIdArray = [];

    if (Array.isArray(interests)) {
      // Iterate over the interests array
      for (let i = 0; i < interests.length; i++) {
        if (interests[i].length > 0) {
          // Check for non-empty tag name
          const existingTag = await Tags.findOne({ name: interests[i] });
          if (existingTag) {
            tagIdArray.push(existingTag.id);
          } else {
            const newTag = new Tags({
              name: interests[i],
            });
            const savedTag = await newTag.save();
            tagIdArray.push(savedTag.id);
          }
        }
      }
    } else {
      const existingTag = await Tags.findOne({ name: interests });
      if (existingTag) {
        tagIdArray.push(existingTag.id);
      } else {
        const newTag = new Tags({
          name: interests,
        });
        const savedTag = await newTag.save();
        tagIdArray.push(savedTag.id);
      }
    }

    // if (interests) {
    //   if (typeof interests === "string") {
    //     interests = interests
    //       .split(",")
    //       .map((interest) => interest.trim())
    //       .filter((interest) => interest.length > 0); // Filter out empty strings
    //   }
    // }
    if (req.file && userProfile.avatar) {
      const filename = userProfile.avatar;
      const filepath = path.join(__dirname, "../avatar/" + filename);
      fs.unlinkSync(filepath);
    }

    userProfile = await Profile.findByIdAndUpdate(
      userProfileId,
      {
        bio,
        location,
        interests: tagIdArray,
        avatar: req.file ? req.file.filename : userProfile.avatar,
      },
      {
        new: true,
      }
    );
    res.json(userProfile);
  } catch (e) {
    return res.status(400).json({
      error: e.message,
      msg: "Something went wrong, Please try again later.",
    });
  }
});

module.exports = router;
