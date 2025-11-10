import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, API_PREFIX } from '@/constants/config';

// For Spring WebSocket with SockJS, we need to use a different approach
// Since React Native doesn't support SockJS directly, we'll use a WebSocket polyfill
// or use socket.io-client with a custom transport

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface WebSocketMessage {
  type: 'new_message' | 'message_sent' | 'message_read' | 'typing' | 'user_online' | 'user_offline';
  message?: any;
  userId?: string;
  data?: any;
}

export type MessageListener = (data: WebSocketMessage) => void;

class WebSocketService {
  private listeners: Map<string, Set<MessageListener>> = new Map();
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    reconnectAttempts = 0;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token found, cannot connect WebSocket');
        this.isConnecting = false;
        return;
      }

      // Native WebSocket endpoint (for React Native)
      // Tự động build URL từ API_BASE:
      // - Nếu API_BASE = "http://192.168.100.175:8080" 
      //   → WebSocket URL = "ws://192.168.100.175:8080/ws/messages?token=..."
      // - Nếu API_BASE = "https://api.example.com"
      //   → WebSocket URL = "wss://api.example.com/ws/messages?token=..."
      const baseUrl = API_BASE.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws';
      
      // Native WebSocket endpoint - URL được build tự động
      const wsUrl = `${wsProtocol}://${baseUrl}/ws/messages?token=${encodeURIComponent(token)}`;
      
      console.log('Connecting to WebSocket:', wsUrl.replace(token, 'TOKEN'));
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        reconnectAttempts = 0;
        // Notify listeners that connection is established
        // Note: Spring WebSocket doesn't support emit from client
        // We just notify local listeners
        this.handleMessage({ type: 'user_online' } as WebSocketMessage);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
  // Nếu đang có timer thì hủy trước
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  reconnectAttempts++;

  // Tăng dần thời gian chờ: 1s, 2s, 4s, 8s, ... tối đa 30s
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);

  console.log(`Scheduling WebSocket reconnect attempt ${reconnectAttempts} in ${delay}ms`);

  // Tạo timer và lưu lại (ReturnType<typeof setTimeout> tương thích cả RN lẫn Node)
  this.reconnectTimer = setTimeout(() => {
    this.connect();
  }, delay) as ReturnType<typeof setTimeout>;
}

  private handleMessage(data: WebSocketMessage) {
    // Emit to all listeners
    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    });
  }

  on(event: string, listener: MessageListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: MessageListener) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, data: any) {
    // For Spring WebSocket, we typically only receive messages
    // Sending is done via REST API
    // This method is kept for compatibility but should not be used
    // to send messages to server - use REST API instead
    if (event !== 'connected') {
      console.warn('Emit (not supported in Spring WebSocket):', event, data);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.listeners.clear();
    console.log('WebSocket disconnected');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();

