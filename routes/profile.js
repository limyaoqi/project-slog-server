const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
const User = require("../models/User");
const multer = require("multer");
const { auth, existingProfile } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

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
    const userProfile = await Profile.findOne({ user: userId });
    if (!userProfile) return res.json({ msg: "Profile Not Found" });
    return res.json(userProfile);
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
    const userProfile = await Profile.findOne({ user: user });
    if (!userProfile) return res.json({ msg: "Profile Not Found" });
    return res.json(userProfile);
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
      let interests = req.body.interests;
      const avatar = req.file.filename;

      // if (typeof interests === "string") {
      //   interests = interests
      //     .split(",")
      //     .map((interest) => interest.trim())
      //     .filter((interest) => interest.length > 0); // Filter out empty strings
      // }

      const profile = new Profile({
        user,
        bio,
        location,
        interests,
        avatar,
      });

      await profile.save();

      await User.findByIdAndUpdate(user, { firstLogin: false });

      return res.json({ profile, msg: "Profile added successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: e.message });
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
        interests,
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
