import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSocket(socketInstance);
    });

    // Handle emergency alerts
    socketInstance.on('emergencyAlert', (alert) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'emergency',
          data: alert,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ].slice(0, 50)); // Keep last 50 notifications
      
      // Play sound for emergency alerts
      playNotificationSound();
    });

    // Handle donation request updates
    socketInstance.on('donationUpdate', (update) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'donationUpdate',
          data: update,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ]);
    });

    // Handle connection errors
    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      toast.error('Connection lost. Attempting to reconnect...');
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/emergency-alert.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const value = {
    socket,
    notifications,
    markAsRead,
    clearNotification,
    sendDonationResponse: (requestId, response) => {
      if (socket) {
        socket.emit('donationResponse', { requestId, response });
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      <NotificationCenter />
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Notification Center Component
const NotificationCenter = () => {
  const { notifications, markAsRead, clearNotification } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-3 bg-gray-800 text-white font-medium flex justify-between items-center">
            <span>Notifications</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-gray-100 ${
                  notification.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {notification.type === 'emergency' 
                        ? 'Emergency Blood Request'
                        : 'Donation Update'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.data.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                {notification.type === 'emergency' && !notification.read && (
                  <div className="mt-2 flex space-x-2">
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                      I Can Help
                    </button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                      Not Available
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 bg-gray-50 text-center">
            <button
              onClick={() => setNotifications([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
