const socket = io();

// DOM Elements
const elements = {
  chat: {
    container: document.getElementById("chat-form-container"),
    form: document.getElementById("chat-form-container").querySelector("form"),
    userNameInput: document
      .getElementById("chat-form-container")
      .querySelector("form")
      .querySelector("#user-name"),
    roomNameInput: document
      .getElementById("chat-form-container")
      .querySelector("form")
      .querySelector("#room-name"),
  },
  room: {
    container: document.getElementById("room-container"),
    form: document.getElementById("room-container").querySelector("form"),
    chats: document.getElementById("room-container").querySelector("ul"),
    title: document.getElementById("room-container").querySelector("h3"),
    messageInput: document
      .getElementById("room-container")
      .querySelector("input"),
  },
  roomList: {
    container: document.getElementById("room-list-container"),
    refreshButton: document
      .getElementById("room-list-container")
      .querySelector("button"),
    list: document.getElementById("room-list-container").querySelector("ul"),
  },
};

// Initial setup
elements.room.container.hidden = true;

// Message Handler
const messageHandler = {
  add(message) {
    const chatItem = document.createElement("li");
    chatItem.innerText = message;
    elements.room.chats.appendChild(chatItem);
  },

  send(message) {
    socket.emit("send-chat-message", message, () => {
      this.add(`you: ${message}`);
    });
    elements.room.messageInput.value = "";
  },
};

// Room Handler
const roomHandler = {
  show(roomName) {
    elements.chat.container.hidden = true;
    elements.room.container.hidden = false;
    elements.room.title.innerText = `${roomName} room`;
  },

  join(userName, roomName) {
    socket.emit("join-room", roomName, userName, () => {
      this.show(roomName);
    });
    elements.chat.roomNameInput.value = "";
  },

  displayRoomList(rooms) {
    elements.roomList.list.innerHTML = "";

    rooms.forEach((room) => {
      const roomItem = document.createElement("li");
      roomItem.innerText = room;
      elements.roomList.list.appendChild(roomItem);
    });
  },
};

// Event Handlers
function handleJoinRoomSubmit(e) {
  e.preventDefault();
  const userName = elements.chat.userNameInput.value;
  const roomName = elements.chat.roomNameInput.value;

  if (!userName || !roomName) {
    alert("사용자 이름과 방 이름을 모두 입력해주세요.");
    return;
  }

  roomHandler.join(userName, roomName);
}

function handleSendMessageSubmit(e) {
  e.preventDefault();
  const message = elements.room.messageInput.value;
  if (!message.trim()) return;
  messageHandler.send(message);
}

function handleRefreshRoomList() {
  socket.emit("refresh-room-list");
}

// Event Listeners
elements.chat.form.addEventListener("submit", handleJoinRoomSubmit);
elements.room.form.addEventListener("submit", handleSendMessageSubmit);
elements.roomList.refreshButton.addEventListener(
  "click",
  handleRefreshRoomList
);

// Socket Event Listeners
socket.on("user-connected", (userName) => alert(`${userName} connected`));
socket.on("user-disconnected", (userName) => alert(`${userName} disconnected`));
socket.on("receive-chat-message", messageHandler.add);
socket.on("refresh-room-list", (rooms) => roomHandler.displayRoomList(rooms));
