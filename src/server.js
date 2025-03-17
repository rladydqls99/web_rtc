import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// 경로 및 환경 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Express 앱 초기화
const app = express();
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

// 미들웨어 및 라우팅 설정
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home.html"));
});

app.get("/*", (_, res) => res.redirect("/"));

// 소켓 이벤트 핸들러 관리
const socketHandlers = {
  handleJoinRoom(socket, roomName, userName, done) {
    if (userName && userName.trim() !== "") {
      socket.userName = userName;
    }

    socket.join(roomName);
    socket.to(roomName).emit("user-connected", socket.userName);

    console.log(`${socket.userName} joined room: ${roomName}`);
    done();
  },

  handleChatMessage(socket, message, done) {
    if (!message || message.trim() === "") {
      done();
      return;
    }

    // 메시지 형식화
    const formattedMessage = `${socket.userName}: ${message}`;

    // 참여한 모든 방에 메시지 전송
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("receive-chat-message", formattedMessage);
      }
    });

    done();
  },

  handleDisconnecting(socket) {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("user-disconnected", socket.userName);
        console.log(`${socket.userName} left room: ${room}`);
      }
    });
  },
};

// 소켓 연결 설정
wsServer.on("connection", (socket) => {
  // 초기 사용자 이름 설정
  socket.userName = "Anonymous";

  console.log(`New connection: ${socket.id}`);

  // 모든 이벤트 로깅
  socket.onAny((event) => {
    console.log(`Event: ${event} from ${socket.id}`);
  });

  // 이벤트 핸들러 등록
  socket.on("join-room", (roomName, userName, done) =>
    socketHandlers.handleJoinRoom(socket, roomName, userName, done)
  );

  socket.on("send-chat-message", (message, done) =>
    socketHandlers.handleChatMessage(socket, message, done)
  );

  socket.on("disconnecting", () => socketHandlers.handleDisconnecting(socket));

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// 서버 시작
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
