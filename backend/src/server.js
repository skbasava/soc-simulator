import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulatorService } from './services/SimulatorService.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors());

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Create simulator service
const simulator = new SimulatorService();

// Subscribe to simulator events and broadcast to all clients
simulator.subscribe((event, data) => {
  io.emit(event, data);
  io.emit('message', data); // Also emit on generic 'message' channel
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('state_sync', simulator.getState());

  // Handle transaction requests
  socket.on('transaction', async (data) => {
    console.log(`[Server] Received transaction from ${socket.id}:`, data);
    await simulator.handleTransaction(data);
  });

  // Handle control commands
  socket.on('control', (data) => {
    console.log(`[Server] Received control command from ${socket.id}:`, data);

    switch (data.command) {
      case 'start':
        simulator.start();
        io.emit('simulation_started', { timestamp: new Date().toISOString() });
        break;

      case 'stop':
        simulator.stop();
        io.emit('simulation_stopped', { timestamp: new Date().toISOString() });
        break;

      case 'reset':
        simulator.reset();
        io.emit('simulation_reset', {
          timestamp: new Date().toISOString(),
          state: simulator.getState(),
        });
        break;

      default:
        console.warn(`[Server] Unknown control command: ${data.command}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`[Server] Client disconnected: ${socket.id} (${reason})`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`[Server] Socket error for ${socket.id}:`, error);
  });
});

// REST API endpoints (for debugging/monitoring)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    state: simulator.getState(),
    connections: io.engine.clientsCount,
  });
});

app.get('/api/state', (req, res) => {
  res.json(simulator.getState());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ARM SoC Simulator Backend Server                       ║
╚════════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🔌 WebSocket endpoint: ws://localhost:${PORT}
📡 REST API: http://localhost:${PORT}/api

State Machines Initialized:
  ✓ ARM CPU (TrustZone enabled)
  ✓ Network on Chip (NOC)
  ✓ Crypto Block

Waiting for client connections...
  `);

  // Auto-start simulation
  simulator.start();
  console.log('✓ Simulation started automatically\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n[Server] Shutting down gracefully...');
  simulator.stop();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\n[Server] Received SIGTERM, shutting down...');
  simulator.stop();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
