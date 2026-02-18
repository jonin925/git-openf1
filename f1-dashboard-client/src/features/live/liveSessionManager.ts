import { socketService } from '../../services/socket';

class LiveSessionManager {
  private activeSubscriptions: Set<number> = new Set();
  private updateCallbacks: Map<number, ((data: any) => void)[]> = new Map();

  subscribe(sessionKey: number, callback: (data: any) => void) {
    // First subscriber for this session
    if (!this.activeSubscriptions.has(sessionKey)) {
      this.activeSubscriptions.add(sessionKey);
      socketService.subscribeToSession(sessionKey);
      this.updateCallbacks.set(sessionKey, []);
    }

    // Add callback
    const callbacks = this.updateCallbacks.get(sessionKey) || [];
    callbacks.push(callback);
    this.updateCallbacks.set(sessionKey, callbacks);

    // Return unsubscribe function
    return () => this.unsubscribe(sessionKey, callback);
  }

  unsubscribe(sessionKey: number, callback: (data: any) => void) {
    const callbacks = this.updateCallbacks.get(sessionKey) || [];
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // No more callbacks, unsubscribe from socket
    if (callbacks.length === 0) {
      this.activeSubscriptions.delete(sessionKey);
      this.updateCallbacks.delete(sessionKey);
      socketService.unsubscribeFromSession(sessionKey);
    }
  }

  notifySubscribers(sessionKey: number, data: any) {
    const callbacks = this.updateCallbacks.get(sessionKey) || [];
    callbacks.forEach(callback => callback(data));
  }
}

export const liveSessionManager = new LiveSessionManager();