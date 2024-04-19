const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const { PORT } = process.env;
// const cors = require("cors");

//connect to mongoose
mongoose
  .connect("mongodb://127.0.0.1:27017/slog")
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log(error);
  });

//my route
// app.use(cors);
app.use(express.json());
app.use("/", require("./routes/users"));
app.use("/post", require("./routes/posts"));
app.use("/comment", require("./routes/comments"));
app.use("/like", require("./routes/likes"));

app.listen(PORT, console.log(`App is running on Port : ${PORT} `));
