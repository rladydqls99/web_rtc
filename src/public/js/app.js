const socket = io();

// DOM 요소 선택
const chatFormContainer = document.getElementById("chat-form-container");
const chatForm = chatFormContainer.querySelector("form");

const roomContainer = document.getElementById("room-container");
const roomForm = roomContainer.querySelector("form");
const roomChats = roomContainer.querySelector("ul");
const roomTitle = roomContainer.querySelector("h3");

const messageInput = roomContainer.querySelector("input");
const userNameInput = chatForm.querySelector("#user-name");
const roomNameInput = chatForm.querySelector("#room-name");

// 초기 설정
roomContainer.hidden = true;

// 메시지 관련 함수
const messageHandler = {
  add(message) {
    const chatItem = document.createElement("li");
    chatItem.innerText = message;
    roomChats.appendChild(chatItem);
  },

  send(message) {
    socket.emit("send-chat-message", message, () => {
      this.add(`you: ${message}`);
    });
    messageInput.value = "";
  },
};

// 방 관련 함수
const roomHandler = {
  show(roomName) {
    chatFormContainer.hidden = true;
    roomContainer.hidden = false;
    roomTitle.innerText = `${roomName} room`;
  },

  join(userName, roomName) {
    socket.emit("join-room", roomName, userName, () => {
      this.show(roomName);
    });
    roomNameInput.value = "";
  },
};

// 이벤트 핸들러
function handleJoinRoomSubmit(e) {
  e.preventDefault();
  const userName = userNameInput.value;
  const roomName = roomNameInput.value;

  if (!userName || !roomName) {
    alert("사용자 이름과 방 이름을 모두 입력해주세요.");
    return;
  }

  roomHandler.join(userName, roomName);
}

function handleSendMessageSubmit(e) {
  e.preventDefault();

  const message = messageInput.value;

  if (!message.trim()) return;

  messageHandler.send(message);
}

// 이벤트 리스너 등록
chatForm.addEventListener("submit", handleJoinRoomSubmit);
roomForm.addEventListener("submit", handleSendMessageSubmit);

// 소켓 이벤트 리스너
socket.on("user-connected", (userName) => alert(`${userName} connected`));
socket.on("user-disconnected", (userName) => alert(`${userName} disconnected`));
socket.on("receive-chat-message", messageHandler.add);
