const express = require("express");
const Tags = require("../models/Tags");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tags = await Tags.find();
    res.status(200).send(tags);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});


