const User = require("../models/User");

const checkFirstLogin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.firstLogin) {
      user.firstLogin = false;
    } 
    
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = checkFirstLogin;
