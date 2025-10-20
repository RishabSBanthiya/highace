import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/schema.js';
import { handleConnection } from './websocket/handler.js';
import { getEscrowWalletAddress, getUSDCMintAddress } from './blockchain/solana.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get escrow wallet address
app.get('/api/config', (req, res) => {
  res.json({
    escrow_wallet: getEscrowWalletAddress(),
    usdc_mint: getUSDCMintAddress(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  handleConnection(ws);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


