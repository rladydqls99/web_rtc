const socket = io();

const $ChatFormContainer = document.getElementById("chat-form-container");
const $ChatForm = $ChatFormContainer.querySelector("form");

const $roomContainer = document.getElementById("room-container");

$roomContainer.hidden = true;

const showRoom = (roomName) => {
  $ChatFormContainer.hidden = true;
  $roomContainer.hidden = false;

  const $roomName = $roomContainer.querySelector("h3");
  $roomName.innerText = `${roomName} room`;
};

const handleJoinRoomSubmit = (e) => {
  e.preventDefault();
  const input = $ChatForm.querySelector("input");

  const roomName = input.value;
  socket.emit("join-room", { roomName }, () => showRoom(roomName));

  input.value = "";
};

$ChatForm.addEventListener("submit", handleJoinRoomSubmit);
