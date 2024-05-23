// Get Notifications for User (GET /api/notifications)
// Mark Notification as Read (PUT /api/notifications/:id)

const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const notifications = await Notification.find({ recipient: user });
    return res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const user = req.user._id;
    const notificationId = req.params.id;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.recipient.toString() !== user.toString()) {
      return res
        .status(401)
        .json({ error: "You are not allowed to perform this action" });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
      },
      { new: true }
    );
    return res.json({
      notification: updatedNotification,
      message: "Notification marked as read",
    });
  } catch (e) {
    return res.json({
      error: e.message,
      msg: "You're not allowed to do this action",
    });
  }
});

module.exports = router;
