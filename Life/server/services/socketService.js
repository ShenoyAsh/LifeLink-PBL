const { Server } = require('socket.io');
const DonationRequest = require('../models/DonationRequest');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.activeDonors = new Map(); // Map of donorId to socketId
    this.activeRequests = new Map(); // Map of requestId to room
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      // Here you would verify the token and attach user data to socket
      // For now, we'll just continue
      next();
    });

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle donor location updates
      socket.on('updateLocation', async (data) => {
        const { donorId, requestId, location } = data;
        
        // Store donor's socket ID and current request
        this.activeDonors.set(donorId, {
          socketId: socket.id,
          requestId,
          location,
          lastUpdated: new Date()
        });

        // Join the request room
        const roomId = `request_${requestId}`;
        await socket.join(roomId);
        this.activeRequests.set(requestId, roomId);

        // Broadcast location to all in the room (hospital/patient)
        socket.to(roomId).emit('donorLocationUpdate', {
          donorId,
          location,
          timestamp: new Date()
        });
      });

      // Handle donor disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up active donors
        for (const [donorId, data] of this.activeDonors.entries()) {
          if (data.socketId === socket.id) {
            this.activeDonors.delete(donorId);
            break;
          }
        }
      });
    });
  }

  // Method to notify donor about a new request
  async notifyDonor(donorId, requestData) {
    const donor = this.activeDonors.get(donorId);
    if (donor) {
      this.io.to(donor.socketId).emit('newDonationRequest', requestData);
      return true;
    }
    return false;
  }

  // Method to get active donors for a request
  getActiveDonors(requestId) {
    const donors = [];
    for (const [donorId, data] of this.activeDonors.entries()) {
      if (data.requestId === requestId) {
        donors.push({
          donorId,
          location: data.location,
          lastUpdated: data.lastUpdated
        });
      }
    }
    return donors;
  }
}

module.exports = SocketService;
