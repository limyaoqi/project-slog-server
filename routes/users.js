const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { SECRET_KEY } = process.env;
const { auth } = require("../middleware/auth");

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
router.get("/", async (req, res) => {
  res.send("hello world");
});

router.post("/login", async (req, res) => {
  try {
    //get the details from the form
    const { email, password } = req.body;

    //find is that had the user the same with the details?
    let userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    //compare the userpassword and formpassword is same or not
    let isMatch = bcrypt.compareSync(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
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
      msg: "Logged in successfully",
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
        .json({ msg: "Username has already been registered" });

    //find whether the email already used or not
    const emailFound = await User.findOne({ email });
    if (emailFound)
      return res.status(400).json({ msg: "Email has already been registered" });

    //check the register details

    if (username.length < 8)
      return res.status(400).json({
        msg: "Username should be atleast 8 characters",
      });
    if (email.length < 8)
      return res.status(400).json({
        msg: "Email should be atleast 8 characters",
      });
    if (password.length < 8)
      return res.status(400).json({
        msg: "Password should be atleast 8 characters",
      });

    //create new user
    let user = new User(req.body);
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    user.password = hash;
    await user.save();

    return res.json({ msg: "Registered Successfully", user });
  } catch (e) {
    return res.status(400).json({ error: e.message });
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

    return res.json({ user, msg: "Logged out successfully" });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
