import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {
      'newDonor': [],
      'emergencyAlert': [],
      'donationUpdate': [],
      'donorLocationUpdate': [],
      'newDonationRequest': []
    };
    this.watchId = null;
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

  // Start tracking and broadcasting donor's location
  startLocationTracking(donorId, requestId) {
    if (this.watchId) {
      this.stopLocationTracking();
    }

    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          // Emit location update to server
          this.emit('updateLocation', {
            donorId,
            requestId,
            location
          });
          
          // Notify any local subscribers
          this.callbacks['donorLocationUpdate'].forEach(callback => 
            callback({ donorId, location })
          );
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // 10 seconds
          timeout: 5000
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser');
    }
  }

  // Stop tracking location
  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Subscribe to donor location updates
  onDonorLocationUpdate(callback) {
    this.callbacks['donorLocationUpdate'].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks['donorLocationUpdate'] = 
        this.callbacks['donorLocationUpdate'].filter(cb => cb !== callback);
    };
  }
}

export default new SocketService();
