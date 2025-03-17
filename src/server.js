import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = 3000;

const app = express();

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home.html"));
});
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket["userName"] = "Anonymous";

  socket.onAny((event) => {
    console.log(`Socket: ${event}`);
  });

  socket.on("join-room", (roomName, userName, done) => {
    if (userName !== "") {
      socket.userName = userName;
    }

    socket.join(roomName);
    done();
    socket.to(roomName).emit("user-connected");
  });

  socket.on("send-chat-message", (roomName, message, done) => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("chat-message", `${socket.userName}: ${message}`);
    });
    done();
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => socket.to(room).emit("user-disconnected"));
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
