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
    ).populate({
      path: "profileId",
      select: "avatar",
    });
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

    if (username.length < 8 || username.length > 20)
      return res.status(400).json({
        message: "Username should be between 8 and 20 characters",
      });

    if (email.length < 8)
      return res.status(400).json({
        message: "Email should be atleast 8 characters",
      });

    const emailLocalPart = email.split("@")[0];
    if (emailLocalPart.length >= 15)
      return res.status(400).json({
        message:
          "The part of the email before '@' should be less than 15 characters",
      });
    if (password.length < 8)
      return res.status(400).json({
        message: "Password should be atleast 8 characters",
      });

    //create new user
    let user = new User({ ...req.body });
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
    const currentUserId = req.user._id;

    let users = await User.find({ _id: { $ne: currentUserId } }).populate({
      path: "profileId",
      select: "avatar",
    });

    // Filter users based on the search query
    if (search) {
      const searchRegex = new RegExp(search, "i"); // 'i' makes it case-insensitive
      users = users.filter((user) => searchRegex.test(user.username));
    }
    return res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again later.",
      error: error.message,
    });
  }
});

router.get("/myUser", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Assuming auth middleware sets req.user

    // Find the user by ID, populate the profileId field, and exclude the password field
    const user = await User.findById(userId)
      .populate({
        path: "profileId",
        select: "avatar",
      })
      .select("-password");

    // If user is not found, send an error response
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
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
  const { password } = req.body;

  try {
    if (req.user.isBlocked) {
      return res.status(400).json({
        message:
          "Your account is currently blocked. Please contact support for further assistance.",
      });
    }
    // Retrieve the user from the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const currentUser = await User.findById(req.user._id);
    if (!currentUser)
      return res.status(404).json({ message: "User not found." });

    // Verify the provided password
    const isMatch = bcrypt.compareSync(password, currentUser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials. Cannot block user." });
    }

    if (user.role === "admin" && currentUser.role === "admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot block other admins." });
    }

    // Block the user
    await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });

    // Update all posts, comments, and replies by the user
    await Promise.all([
      Post.updateMany({ user: userId }, { isDeleted: true }),
      Comment.updateMany({ user: userId }, { isDeleted: true }),
      Reply.updateMany({ user: userId }, { isDeleted: true }),
    ]);

    return res.json({
      message:
        "User blocked successfully and all related content marked as deleted.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again later.",
      error: error.message,
    });
  }
});

router.put("/unblock-user/:userId", auth, isAdmin, async (req, res) => {
  const userId = req.params.userId;
  const { password } = req.body;

  try {
    // Retrieve the user from the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const currentUser = await User.findById(req.user._id);
    if (!currentUser)
      return res.status(404).json({ message: "User not found." });

    // Verify the provided password
    const isMatch = bcrypt.compareSync(password, currentUser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials. Cannot block user." });
    }

    // Block the user
    await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });

    // Update all posts, comments, and replies by the user
    // await Promise.all([
    //   Post.updateMany({ user: userId }, { isDeleted: true }),
    //   Comment.updateMany({ user: userId }, { isDeleted: true }),
    //   Reply.updateMany({ user: userId }, { isDeleted: true }),
    // ]);

    return res.json({
      message: "User unblocked successfully.",
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
    try {
      const { userId } = req.params;
      const { password, role } = req.body;

      if (!password || !role) {
        return res
          .status(400)
          .json({ message: "Password and role are required." });
      }

      const userToPromote = await User.findById(userId);
      if (!userToPromote)
        return res.status(404).json({ message: "User not found." });

      const currentUser = await User.findById(req.user._id);
      const isMatch = bcrypt.compareSync(password, currentUser.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid credentials. Cannot promote user." });
      }

      // Promote the user to admin
      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      );
      if (!user) return res.status(404).json({ message: "User not found." });

      return res.json({ message: "User promoted to admin.", user });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong, please try again later.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
