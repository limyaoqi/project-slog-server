const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
require("dotenv").config();
const { SECRET_KEY } = process.env;

const auth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded.data;

    next();
  } catch (e) {
    return res.status(401).json({ error: e.message, message: "Unauthorized" });
    // .redirect("/login");
  }
};

const existingProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ user: userId });

    if (profile) {
      return res
        .status(400)
        .json({ message: "Profile already exists for this user" });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const isAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superAdmin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superAdmin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. SuperAdmins only." });
  }
};

module.exports = {
  auth,
  existingProfile,
  isAdmin,
  isSuperAdmin,
};
