const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { SECRET_KEY } = process.env;
const { auth, isAdmin, isSuperAdmin } = require("../middleware/auth");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");

/*
example account
admin acc
{
  "username": "johndoe123",
  "password": "securepassword"
  "email": "johndoe@example.com",
}
user acc
{
  "username": "johndoe2",
  "password": "securepassword",
  "email": "johndoe2@example.com"
}
*/

router.post("/login", async (req, res) => {
  try {
    //get the details from the form
    const { email, password } = req.body;

    //find is that had the user the same with the details?
    let userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    //compare the userpassword and formpassword is same or not
    let isMatch = bcrypt.compareSync(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    userFound = userFound.toObject();
    delete userFound.password;

    let token = jwt.sign({ data: userFound }, SECRET_KEY, { expiresIn: "1d" });

    //change the online status to online(true)
    const onlineUser = await User.findByIdAndUpdate(
      userFound._id,
      {
        isOnline: true,
        lastActive: new Date(),
      },
      {
        new: true,
      }
    );
    console.log(onlineUser);

    return res.json({
      token,
      user: onlineUser,
      message: "Logged in successfully",
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    //get the data from form
    const { username, email, password } = req.body;

    //find whether the username already used or not
    const userFound = await User.findOne({ username });
    if (userFound)
      return res
        .status(400)
        .json({ message: "Username has already been registered" });

    //find whether the email already used or not
    const emailFound = await User.findOne({ email });
    if (emailFound)
      return res
        .status(400)
        .json({ message: "Email has already been registered" });

    //check the register details

    if (username.length < 8)
      return res.status(400).json({
        message: "Username should be atleast 8 characters",
      });
    if (email.length < 8)
      return res.status(400).json({
        message: "Email should be atleast 8 characters",
      });
    if (password.length < 8)
      return res.status(400).json({
        message: "Password should be atleast 8 characters",
      });

    //create new user
    let user = new User({...req.body});
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    user.password = hash;
    await user.save();

    return res.json({ message: "Registered Successfully", user });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const search = req.query.search || "";

    const users = await User.find();

    // Filter users based on the search query
    if (search) {
      const searchRegex = new RegExp(search, "i"); // 'i' makes it case-insensitive
      users = users.filter((user) => searchRegex.test(user.username));
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again later.",
      error: error.message,
    });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isOnline: false,
        lastActive: new Date(),
      },
      {
        new: true,
      }
    );

    return res.json({ user, message: "Logged out successfully" });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

router.put("/block-user/:userId", auth, isAdmin, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Block the user
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    // Update all posts by the user
    await Post.updateMany({ user: userId }, { isDeleted: true });

    // Update all comments by the user
    await Comment.updateMany({ user: userId }, { isDeleted: true });

    // Update all replies by the user
    await Reply.updateMany({ user: userId }, { isDeleted: true });

    res.json({
      message:
        "User blocked and all posts, comments, and replies marked as deleted.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again later.",
      error: error.message,
    });
  }
});

router.put(
  "/promote-to-admin/:userId",
  auth,
  isSuperAdmin,
  async (req, res) => {
    const { userId } = req.params;

    try {
      // Promote the user to admin
      const user = await User.findByIdAndUpdate(
        userId,
        { role: "admin" },
        { new: true }
      );
      if (!user) return res.status(404).json({ message: "User not found." });

      res.json({ message: "User promoted to admin.", user });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong, please try again later.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
