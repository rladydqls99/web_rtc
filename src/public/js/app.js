// DOM 요소
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const roomInput = document.getElementById("roomInput");
const joinButton = document.getElementById("joinButton");

const startButton = document.getElementById("startButton");
const muteAudioButton = document.getElementById("muteAudioButton");
const stopVideoButton = document.getElementById("stopVideoButton");
const leaveButton = document.getElementById("leaveButton");

const statusElement = document.getElementById("status");

// 상태 변수
let localStream;
let currentRoom;
const peerConnections = {};

// Socket.IO 연결
const socket = io();

// 이벤트 리스너 설정
joinButton.addEventListener("click", joinRoom);
startButton.addEventListener("click", startMedia);
muteAudioButton.addEventListener("click", toggleAudio);
stopVideoButton.addEventListener("click", toggleVideo);
leaveButton.addEventListener("click", leaveRoom);

// 미디어 스트림 시작
async function startMedia() {
  try {
    // 로컬 카메라와 마이크 접근
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // 로컬 비디오 스트림 설정(html 요소에 연결)
    localVideo.srcObject = localStream;
    startButton.disabled = true;
    setStatus("미디어 접근 성공. 이제 방에 참가할 수 있습니다.");
  } catch (error) {
    console.error("미디어 접근 오류:", error);
    setStatus("카메라나 마이크 접근에 실패했습니다: " + error.message);
  }
}

// 방 참가
function joinRoom() {
  const roomId = roomInput.value.trim();
  if (!roomId) {
    setStatus("방 ID를 입력해주세요.");
    return;
  }

  if (!localStream) {
    setStatus("먼저 미디어 스트림을 시작해주세요.");
    return;
  }

  currentRoom = roomId;
  socket.emit("join", roomId);
  joinButton.disabled = true;
  leaveButton.disabled = false;
  setStatus(`방 ${roomId}에 참가 중...`);
}

// 오디오 토글
function toggleAudio() {
  if (!localStream) return;

  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) return;

  const enabled = !audioTracks[0].enabled;
  audioTracks[0].enabled = enabled;
  muteAudioButton.textContent = enabled
    ? "오디오 음소거"
    : "오디오 음소거 해제";
}

// 비디오 토글
function toggleVideo() {
  if (!localStream) return;

  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) return;

  const enabled = !videoTracks[0].enabled;
  videoTracks[0].enabled = enabled;
  stopVideoButton.textContent = enabled ? "비디오 중지" : "비디오 시작";
}

// 방 나가기
function leaveRoom() {
  if (currentRoom) {
    // 모든 WebRTC 연결 종료
    Object.values(peerConnections).forEach((pc) => pc.close());
    peerConnections = {};

    socket.emit("leave", currentRoom);
    currentRoom = null;

    // 리모트 비디오 스트림 제거
    remoteVideo.srcObject = null;

    joinButton.disabled = false;
    leaveButton.disabled = true;
    setStatus("방에서 나왔습니다.");
  }
}

// WebRTC 연결 생성
function createPeerConnection(socketId) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  });

  // 로컬 스트림 추가
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // ICE 후보 처리
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice_candidate", {
        targetId: socketId,
        candidate: event.candidate,
      });
    }
  };

  // 연결 상태 변화 처리
  pc.onconnectionstatechange = (event) => {
    if (pc.connectionState === "connected") {
      setStatus("피어와 연결되었습니다.");
    }
  };

  // 리모트 스트림 처리
  pc.ontrack = (event) => {
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      setStatus("상대방의 미디어 스트림을 수신 중입니다.");
    }
  };

  peerConnections[socketId] = pc;
  return pc;
}

// 상태 메시지 설정
function setStatus(message) {
  statusElement.textContent = message;
  console.log(message);
}

// Socket.IO 이벤트 리스너
socket.on("connect", () => {
  setStatus("서버에 연결되었습니다. ID: " + socket.id);
});

socket.on("room_joined", (data) => {
  setStatus(
    `방 ${data.roomId}에 참가했습니다. 현재 ${data.numClients}명의 사용자가 있습니다.`
  );
});

// 나는 방에 존재하고, 다른 사용자가 방에 들어온 경우
socket.on("new_peer", async (data) => {
  setStatus("새로운 피어가 방에 참가했습니다. 연결 시도 중...");
  const pc = createPeerConnection(data.socketId);
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
      targetId: data.socketId,
      sdp: pc.localDescription,
    });
  } catch (error) {
    console.error("Offer 생성 오류:", error);
  }
});

socket.on("offer", async (data) => {
  setStatus("Offer를 수신했습니다. Answer 전송 중...");
  const pc = createPeerConnection(data.socketId);
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", {
      targetId: data.socketId,
      sdp: pc.localDescription,
    });
  } catch (error) {
    console.error("Answer 생성 오류:", error);
  }
});

socket.on("answer", async (data) => {
  setStatus("Answer를 수신했습니다.");
  const pc = peerConnections[data.socketId];
  if (pc) {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (error) {
      console.error("RemoteDescription 설정 오류:", error);
    }
  }
});

socket.on("ice_candidate", async (data) => {
  const pc = peerConnections[data.socketId];
  if (pc) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error("ICE 후보 추가 오류:", error);
    }
  }
});

socket.on("peer_disconnected", (data) => {
  setStatus("피어가 연결을 종료했습니다.");
  if (peerConnections[data.socketId]) {
    peerConnections[data.socketId].close();
    delete peerConnections[data.socketId];

    // 상대방이 나간 경우 리모트 비디오 스트림 제거
    remoteVideo.srcObject = null;
  }
});

socket.on("disconnect", () => {
  setStatus("서버와의 연결이 끊어졌습니다.");
});
