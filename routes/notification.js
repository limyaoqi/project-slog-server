// Get Notifications for User (GET /api/notifications)
// Mark Notification as Read (PUT /api/notifications/:id)

const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();
const { auth } = require("../middleware/auth");
const path = require("path");

router.get("/", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const notifications = await Notification.find({ recipient: user }).populate(
      {
        path: "createdBy",
        select: "username",
        populate: {
          path: "profileId",
          select: "avatar",
        },
      }
    );
    return res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    const user = req.user._id;

    // Update all notifications for the user to read
     await Notification.updateMany(
      { recipient: user, read: false },
      { $set: { read: true } }
    );

    // Return the count of modified documents
    return res.json({
      message: "All notifications marked as read",
    });
  } catch (e) {
    return res.json({
      error: e.message,
      msg: "You're not allowed to do this action",
    });
  }
});

module.exports = router;
