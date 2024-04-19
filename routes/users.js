const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { SECRET_KEY } = process.env;
const auth = require("../middleware/auth");

/*
example account
admin acc
{
  "fullname": "John Doe",
  "username": "johndoe123",
  "password": "securepassword"
  "email": "johndoe@example.com",
}
*/

router.post("/login", async (req, res) => {
  try {
    //get the details from the form
    const { username, password } = req.body;

    //find is that had the user the same with the details?
    let userFound = await User.findOne({ username });
    if (!userFound) {
      return res.json({ msg: "Invalid Credentials", status: 400 });
    }

    //compare the userpassword and formpassword is same or not
    let isMatch = bcrypt.compareSync(password, userFound.password);
    if (!isMatch) {
      return res.json({ msg: "Invalid Credentials", status: 400 });
    }

    userFound = userFound.toObject();
    delete userFound.password;

    let token = jwt.sign({ data: userFound }, SECRET_KEY, { expiresIn: "7d" });

    //change the online status to online(true)
    const onlineUser = await User.findByIdAndUpdate(userFound._id, {
      isOnline: true,
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
    const { fullname, username, email, password } = req.body;

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
    if (fullname.length < 3)
      return res.json({
        msg: "Fullname should be atleast 3 characters ",
        status: 400,
      });
    if (username.length < 8)
      return res.json({
        msg: "Username should be atleast 8 characters",
        status: 400,
      });
    if (email.length < 8)
      return res.json({
        msg: "Email should be atleast 8 characters",
        status: 400,
      });
    if (password.length < 8)
      return res.json({
        msg: "Password should be atleast 8 characters",
        status: 400,
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
    const user = await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
    });

    return res.json({ user, msg: "Logged out successfully" });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
