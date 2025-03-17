const socket = io();

const ChatFormContainer = document.getElementById("chat-form-container");
const ChatForm = ChatFormContainer.querySelector("form");

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = ChatForm.querySelector("input");

  socket.emit("join-room", { roomName: input.value }, () => {
    console.log("Joined room");
  });
  input.value = "";
};

ChatForm.addEventListener("submit", handleRoomSubmit);
