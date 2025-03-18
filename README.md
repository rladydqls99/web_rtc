# WebRTC 화상 채팅 애플리케이션

WebRTC와 Socket.IO를 활용한 브라우저 기반 실시간 화상 채팅 애플리케이션입니다. 플러그인 없이 브라우저 간 P2P 연결을 통해 고품질 화상/음성 통화를 지원합니다.

## 주요 기능

- 실시간 화상/음성
- 방 기반 다중 연결 지원
- NAT/방화벽 환경에서 동작하는 P2P 연결

## 기술 스택

- **Frontend**: JavaScript, HTML5, WebRTC API
- **Backend**: Node.js, Express
- **실시간 통신**: Socket.IO, WebRTC

## 동작 원리

이 애플리케이션은 WebRTC를 사용하여 브라우저 간 직접적인 P2P 연결을 설정하고, Socket.IO를 시그널링 서버로 활용합니다. 다음과 같은 과정으로 연결이 이루어집니다:

1. 시그널링 서버를 통한 피어 정보 교환 (SDP Offer/Answer)
2. ICE 후보 교환을 통한 최적 연결 경로 탐색
3. P2P 연결 설정 및 미디어 스트림 교환

## 설치 방법

1. 저장소 클론

```bash
git clone https://github.com/yourusername/web_rtc.git
cd web_rtc
```

2. 의존성 설치

```bash
npm install
```

## 실행 방법

1. 서버 실행

```bash
npm run dev
```

2. 브라우저에서 접속

```
http://localhost:3000
```

## 사용 방법

1. 웹 페이지에 접속하면 카메라와 마이크 권한을 요청합니다.
2. 방 ID를 입력하여 방을 생성하거나 기존 방에 참가합니다.
3. 같은 방 ID로 다른 사용자가 참가하면 자동으로 연결이 설정됩니다.
4. 연결이 설정되면 상대방의 비디오와 오디오가 표시됩니다.

## 시스템 요구사항

- 최신 버전의 Chrome, Firefox, Safari 또는 Edge 브라우저
- 카메라 및 마이크 장치

## 주의사항

- 로컬 개발 환경에서는 HTTPS 설정 없이 작동하지만, 실제 배포 시에는 보안을 위해 HTTPS 설정이 필요합니다.
- STUN/TURN 서버 설정을 통해 다양한 네트워크 환경에서의 연결 성공률을 높일 수 있습니다.
