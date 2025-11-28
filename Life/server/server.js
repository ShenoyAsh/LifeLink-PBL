require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const http = require('http');

const allRoutes = require('./routes');
const { connectDB } = require('./utils/db');
const SocketService = require('./services/socketService');
const { errorHandler, notFound } = require('./utils/errorResponse');

// --- Initialization ---
const app = express();
const httpServer = http.createServer(app);
connectDB();

// Initialize WebSocket server
const socketService = new SocketService(httpServer);

// Make socketService available in request object
app.use((req, res, next) => {
  req.socketService = socketService;
  next();
});

// --- Data Directory Check ---
// Ensure /data directory exists for Excel files
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Created /data directory for Excel storage.');
}

// --- Core Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Trust Proxy ---
app.set('trust proxy', 1); // Trust first proxy

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// --- Static Asset Serving (for Blood Bank file) ---
app.use('/static', express.static(path.join(__dirname, 'data')));

// --- API Routes ---
app.use('/api', allRoutes);

// --- 404 Handler ---
app.all('*', notFound);

// --- Global Error Handler ---
app.use(errorHandler);

// --- Start Server ---
// UPDATED: Defaults to 5001 to match client configuration
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 LifeLink Server running on http://localhost:${PORT}`);
  console.log(`🔄 WebSocket server is running on ws://localhost:${PORT}`);
});