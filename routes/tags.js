const express = require("express");
const Tags = require("../models/Tags");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tags = await Tags.find();
    return res.status(200).json(tags);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
