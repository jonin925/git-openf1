
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  updateLiveData, 
  setConnectionStatus,
  addActiveSession,
  removeActiveSession 
} from '../features/live/liveSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(setConnectionStatus('connected'));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      store.dispatch(setConnectionStatus('disconnected'));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      store.dispatch(setConnectionStatus('error'));
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.socket?.disconnect();
      }
    });

    // Live data handlers
    this.socket.on('live:data', (data) => {
      store.dispatch(updateLiveData(data));
    });

    this.socket.on('live:session:started', (data) => {
      store.dispatch(addActiveSession(data));
    });

    this.socket.on('live:session:ended', (data) => {
      store.dispatch(removeActiveSession(data.sessionKey));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToSession(sessionKey: number) {
    this.socket?.emit('session:subscribe', sessionKey);
  }

  unsubscribeFromSession(sessionKey: number) {
    this.socket?.emit('session:unsubscribe', sessionKey);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();