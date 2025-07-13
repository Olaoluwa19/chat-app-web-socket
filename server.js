const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const PORT = 3000 || process.env.PORT;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "ChatCord Bot";

// SET STATIC FOLDER
app.use(express.static(path.join(__dirname, "public")));

// RUN WHEN CLIENT CONNECTS
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // WELCOME CURRENT USER
    socket.emit("message", formatMessage(botName, "Welcome to chatCord!"));

    // BROADCAST WHEN A USER JOINS
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // SEND USERS AND ROOM INFO
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
  // LISTEN FOR CHAT MESSAGE
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // RUNS WHEN A USER DISCONNECTS
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(
          botName,
          `
       ${user.username} has left the chat`
        )
      );

      // SEND USERS AND ROOM INFO
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//51 : 11
