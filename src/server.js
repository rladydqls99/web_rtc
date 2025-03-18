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

// Socket event handlers
class SocketHandlers {
  static handleJoinRoom(socket, roomName, userName, done) {
    if (userName && userName.trim() !== "") {
      socket.userName = userName;
    }

    socket.join(roomName);
    socket.to(roomName).emit("user-connected", socket.userName);

    console.log(`${socket.userName} joined room: ${roomName}`);
    done();
  }

  static handleChatMessage(socket, message, done) {
    if (!message || message.trim() === "") {
      done();
      return;
    }

    const formattedMessage = `${socket.userName}: ${message}`;

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("receive-chat-message", formattedMessage);
      }
    });

    done();
  }

  static handleDisconnecting(socket) {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("user-disconnected", socket.userName);
        console.log(`${socket.userName} left room: ${room}`);
      }
    });
  }

  static handleGetRoomList(io, socket) {
    const { sids, rooms } = io.sockets.adapter;

    const publicRooms = [];
    rooms.forEach((_, key) => {
      if (sids.get(key) === undefined) {
        publicRooms.push(key);
      }
    });

    socket.emit("refresh-room-list", publicRooms);
  }
}

// Configure socket connections
const configureSocketEvents = (io) => {
  io.on("connection", (socket) => {
    // Set default username
    socket.userName = "Anonymous";

    console.log(`New connection: ${socket.id}`);

    // Log all events
    socket.onAny((event) => {
      console.log(`Event: ${event} from ${socket.id}`);
    });

    // Register event handlers
    socket.on("join-room", (roomName, userName, done) =>
      SocketHandlers.handleJoinRoom(socket, roomName, userName, done)
    );

    socket.on("send-chat-message", (message, done) =>
      SocketHandlers.handleChatMessage(socket, message, done)
    );

    socket.on("refresh-room-list", () =>
      SocketHandlers.handleGetRoomList(io, socket)
    );

    socket.on("disconnecting", () =>
      SocketHandlers.handleDisconnecting(socket)
    );

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id}`);
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
