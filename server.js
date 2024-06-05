const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();
const { PORT } = process.env;
// const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(express.static("avatar"));
app.use(express.static("public"));

const crossHandler = cors({
  origin: "*",
  methods: "GET,PUT,POST,DELETE",
  allowedHeaders: ["Content-Type", "x-auth-token"],
  preflightContinue: true,
  optionsSuccessStatus: 200,
});

app.use(crossHandler);

// const io = socketIo(server);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// const wss = new WebSocket.Server({ server: server });

// wss.on("connection", function connection(ws) {
//   //Send a message to server when client connect
//   console.log("A New Client connected");
//   //Send a message to client when client connect
//   ws.send("Welcome new client");
//   //if go message coming
//   ws.on("message", function incoming(message) {
//     //will show in server
//     console.log("received: %s", message);

//     //it will go to WebSocketServer go through every clients so for each client
//     wss.clients.forEach(function each(client) {
//       //client != ws      => it will check the client is the one who send the message
//       //client.readyState => the client that no the one who send the message is connected to websocket
//       //WebSocket.OPEN    => it will check the connection is currently open
//       if (client !== ws &&client.readyState === WebSocket.OPEN) {
//         client.send(message);
//       }
//     });
//   });
//   // ws.on("message", (message) => {
//   //   ws.send(`your message: ${message}`);
//   //   console.log("received: %s", message);
//   // });
// });

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/slog")
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log(error);
  });

// Middleware and routes for Express app
app.use(express.json());
app.use("/", require("./routes/users"));
app.use("/profile", require("./routes/profile"));
app.use("/post", require("./routes/posts"));
app.use("/follow", require("./routes/follows"));
app.use("/comment", require("./routes/comments"));
app.use("/chat", require("./routes/chat"));
app.use("/like", require("./routes/likes"));
app.use("/friendships", require("./routes/friendships"));
app.use("/notifications", require("./routes/notification"));
app.use("/tags", require("./routes/tags"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send a welcome message to the connected client
  socket.emit("message", "Welcome new client");

  // Listen for incoming messages from the client
  socket.on("message", (message) => {
    console.log("Received message:", message);

    // Broadcast the message to all connected clients, including the sender
    // io.emit("message", message);

    // Broadcast the message to all connected clients, expect the sender
    socket.broadcast.emit("message", message);
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start Express server
server.listen(PORT, () => {
  console.log(`App is running on Port : ${PORT}`);
});

module.exports = server;
