const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
require("dotenv").config();
const { SECRET_KEY } = process.env;

const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded.data;
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ error: e.message, msg: "Unauthorized" })
      .redirect("/login");
  }
};

const existingProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ user: userId });

    if (profile) {
      return res
        .status(400)
        .json({ msg: "Profile already exists for this user" });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  auth,
  existingProfile,
};
