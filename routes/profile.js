const express = require("express");
const Profile = require("../models/Profile");
const checkFirstLogin = require("../middleware/checkFirstLogin");
const router = express.Router();
const auth = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./avatar");
  }, //where to save the images
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }, //format the filename before storing it
});

const upload = multer({ storage });

router.get("/", auth, (req, res) => {});

// router.post(
//   "/",
//   auth,
//   checkFirstLogin,
//   upload.single("avatar"),
//   async (req, res) => {
//     const user = req.user._id;
//     const bio = req.body.bio;
//     const location = req.body.location;
//     const website = req.body.website;
//     const interests = req.body.interests;
//     const avatar = req.file.filename;

//     const profile = new Profile({
//       user,
//       bio,
//       location,
//       website,
//       interests,
//       avatar,
//     });

//     try {
//       await profile.save();
//       return res.json({ profile, msg: "Profile added successfully" });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ msg: "Server Error" });
//     }
//   }
// );

router.put("/", auth, (req, res) => {});
