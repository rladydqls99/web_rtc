const socket = io();

const $ChatFormContainer = document.getElementById("chat-form-container");
const $ChatForm = $ChatFormContainer.querySelector("form");

const $roomContainer = document.getElementById("room-container");
const $roomForm = $roomContainer.querySelector("form");

$roomContainer.hidden = true;

let roomName;

const addMessage = (message) => {
  const $RoomChats = $roomContainer.querySelector("ul");
  const $chat = document.createElement("li");

  $chat.innerText = message;
  $RoomChats.appendChild($chat);
};

const showRoom = (roomName) => {
  $ChatFormContainer.hidden = true;
  $roomContainer.hidden = false;

  const $roomName = $roomContainer.querySelector("h3");
  $roomName.innerText = `${roomName} room`;
};

const handleJoinRoomSubmit = (e) => {
  e.preventDefault();

  const userNameInput = $ChatForm.querySelector("#user-name");
  const roomNameInput = $ChatForm.querySelector("#room-name");

  const userName = userNameInput.value;
  roomName = roomNameInput.value;

  socket.emit("join-room", roomName, userName, () => showRoom(roomName));

  roomNameInput.value = "";
};

const handleSendMessageSubmit = (e) => {
  e.preventDefault();

  const messageInput = $roomContainer.querySelector("input");
  const message = messageInput.value;

  socket.emit("send-chat-message", roomName, message, () =>
    addMessage(`you: ${message}`)
  );

  messageInput.value = "";
};

$ChatForm.addEventListener("submit", handleJoinRoomSubmit);
$roomForm.addEventListener("submit", handleSendMessageSubmit);

socket.on("user-connected", () => addMessage("User connected"));

socket.on("user-disconnected", () => addMessage("User disconnected"));

socket.on("chat-message", addMessage);
