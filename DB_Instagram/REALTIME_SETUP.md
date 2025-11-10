# Hướng dẫn Setup Real-time Messaging với WebSocket

## Các bước implement:

### 1. Backend (Spring Boot WebSocket)

#### Bước 1: Thêm dependency vào `build.gradle`
```gradle
implementation 'org.springframework.boot:spring-boot-starter-websocket'
```

#### Bước 2: Tạo WebSocket Config
- File: `config/WebSocketConfig.java`
- Enable WebSocket support

#### Bước 3: Tạo WebSocket Handler
- File: `handler/MessageWebSocketHandler.java`
- Xử lý connect, disconnect, send message

#### Bước 4: Tạo WebSocket Controller
- File: `controller/WebSocketController.java`
- Endpoint để connect WebSocket

#### Bước 5: Cập nhật MessageService
- Broadcast message khi có tin nhắn mới

### 2. Frontend (React Native)

#### Bước 1: Cài đặt package
```bash
npm install socket.io-client
```

#### Bước 2: Tạo WebSocket service
- File: `services/websocket.ts`
- Connect và quản lý WebSocket connection

#### Bước 3: Cập nhật chat screen
- Listen events từ WebSocket
- Update messages real-time

## Lưu ý:
- WebSocket cần authentication (JWT token)
- Handle reconnection khi mất kết nối
- Fallback về REST API nếu WebSocket fail

