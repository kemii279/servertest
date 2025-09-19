const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// socket.id → { room, username }
const users = {};

io.on("connection", (socket) => {
  console.log("新しいクライアント接続:", socket.id);

  // 入室
  socket.on("joinRoom", ({ room_id, username }) => {
    socket.join(room_id);
    users[socket.id] = { room: room_id, username };

    console.log(`ユーザー ${username} (${socket.id}) が room ${room_id} に参加`);

    socket.to(room_id).emit("message", {
      user: "system",
      text: `${username} が入室しました`,
    });
  });

  // メッセージ送信
  socket.on("sendMessage", ({ room_id, text }) => {
    const username = users[socket.id]?.username || "unknown";
    io.to(room_id).emit("message", { user: username, text });
  });

  // 手動退出
  socket.on("leaveRoom", () => {
    const userInfo = users[socket.id];
    if (userInfo) {
      const { room, username } = userInfo;
      socket.leave(room);
      console.log(`ユーザー ${username} (${socket.id}) が room ${room} を手動退出`);
      socket.to(room).emit("message", {
        user: "system",
        text: `${username} が退出しました`,
      });
      delete users[socket.id];
    }
  });

  // 切断時
  socket.on("disconnect", () => {
    const userInfo = users[socket.id];
    if (userInfo) {
      const { room, username } = userInfo;
      console.log(`ユーザー ${username} (${socket.id}) が room ${room} を切断退出`);
      socket.to(room).emit("message", {
        user: "system",
        text: `${username} が退出しました`,
      });
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log("Socket.IO サーバーが http://localhost:3000 で起動中");
});
