import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// Path and environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Initialize Express app and servers
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Configure middleware and routes
const configureApp = () => {
  app.use("/public", express.static(path.join(__dirname, "public")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "home.html"));
  });

  app.get("/*", (_, res) => res.redirect("/"));
};

// Configure socket connections
const configureSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("사용자가 연결됨: " + socket.id);

    // 방 참가 처리
    socket.on("join", (roomId) => {
      socket.join(roomId);
      const roomClients = io.sockets.adapter.rooms.get(roomId);
      const numClients = roomClients ? roomClients.size : 0;

      // 방에 있는 클라이언트 수에 따라 처리
      io.to(socket.id).emit("room_joined", { roomId, numClients });

      // 방에 새 사용자가 들어왔음을 알림
      if (numClients > 1) {
        socket.to(roomId).emit("new_peer", { socketId: socket.id });
      }
    });

    // WebRTC 시그널링 메시지 처리
    socket.on("offer", (data) => {
      socket.to(data.targetId).emit("offer", {
        sdp: data.sdp,
        socketId: socket.id,
      });
    });

    socket.on("answer", (data) => {
      socket.to(data.targetId).emit("answer", {
        sdp: data.sdp,
        socketId: socket.id,
      });
    });

    socket.on("ice_candidate", (data) => {
      socket.to(data.targetId).emit("ice_candidate", {
        candidate: data.candidate,
        socketId: socket.id,
      });
    });

    // 연결 종료 처리
    socket.on("disconnect", () => {
      console.log("사용자 연결 종료: " + socket.id);
      io.emit("peer_disconnected", { socketId: socket.id });
    });
  });
};

// Main application initialization
const initializeApp = () => {
  configureApp();
  configureSocketEvents(io);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

// Start the application
initializeApp();
