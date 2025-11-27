import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      'newDonor': [],
      'emergencyAlert': [],
      'donationRequest': [],
      'donationStatusUpdate': []
    };
  }

  connect(token) {
    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    // Register all event listeners
    Object.keys(this.callbacks).forEach(event => {
      this.socket.on(event, (data) => {
        this.callbacks[event].forEach(callback => callback(data));
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    
    // Return cleanup function
    return () => {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
