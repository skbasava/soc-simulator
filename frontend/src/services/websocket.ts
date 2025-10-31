import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage, TransactionRequest } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: WebSocketMessage) => void>> = new Map();

  connect(url: string = 'http://localhost:4000'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      // Listen for all message types
      this.socket.on('message', (data: WebSocketMessage) => {
        this.handleMessage(data);
      });

      // Specific event listeners
      this.socket.on('transaction_result', (data) => this.handleMessage(data));
      this.socket.on('state_update', (data) => this.handleMessage(data));
      this.socket.on('register_update', (data) => this.handleMessage(data));
      this.socket.on('security_violation', (data) => this.handleMessage(data));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendTransaction(transaction: TransactionRequest): void {
    if (this.socket && this.socket.connected) {
      console.log('Sending transaction:', transaction);
      this.socket.emit('transaction', transaction);
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendControl(command: 'start' | 'stop' | 'reset'): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('control', { command });
    }
  }

  on(eventType: string, callback: (data: WebSocketMessage) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private handleMessage(data: WebSocketMessage): void {
    // Notify all listeners
    const allListeners = this.listeners.get('*') || new Set();
    allListeners.forEach(callback => callback(data));

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(data.type) || new Set();
    typeListeners.forEach(callback => callback(data));
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();
