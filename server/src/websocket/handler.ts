import { WebSocket } from 'ws';
import {
  createRoom,
  getRoom,
  validateRoomPassword,
  getAvailableSeat,
  addPlayerToRoom,
  removePlayerFromRoom,
  getRoomPlayers,
  updatePlayerConnection,
  findPlayerActiveRoom,
  getPlayerInRoom,
  closeRoom,
} from '../game/room.js';
import { getGameState, startNewHand, processPlayerAction } from '../game/poker.js';
import { verifyBuyInTransaction, verifyCashOutTransaction } from '../blockchain/solana.js';
import { FIXED_BUY_IN, PlayerAction } from '../types/index.js';

interface Client {
  ws: WebSocket;
  wallet_address?: string;
  room_id?: string;
}

const clients = new Map<WebSocket, Client>();
const roomClients = new Map<string, Set<WebSocket>>();

// Action timeouts
const actionTimeouts = new Map<string, NodeJS.Timeout>();
const ACTION_TIMEOUT_MS = 30000; // 30 seconds

export function handleConnection(ws: WebSocket) {
  const client: Client = { ws };
  clients.set(ws, client);

  ws.on('message', async (data: string) => {
    try {
      const message = JSON.parse(data);
      await handleMessage(ws, message);
    } catch (error) {
      console.error('Error handling message:', error);
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

async function handleMessage(ws: WebSocket, message: any) {
  const { type, payload } = message;
  const client = clients.get(ws);
  if (!client) return;

  switch (type) {
    case 'create_room':
      await handleCreateRoom(ws, payload);
      break;
    case 'join_room':
      await handleJoinRoom(ws, payload);
      break;
    case 'buy_in':
      await handleBuyIn(ws, payload);
      break;
    case 'player_action':
      await handlePlayerAction(ws, payload);
      break;
    case 'cash_out':
      await handleCashOut(ws, payload);
      break;
    case 'reconnect':
      await handleReconnect(ws, payload);
      break;
    case 'close_room':
      await handleCloseRoom(ws, payload);
      break;
    default:
      sendError(ws, 'Unknown message type');
  }
}

async function handleCreateRoom(ws: WebSocket, payload: any) {
  const { wallet_address, small_blind, big_blind, password, max_players } = payload;

  if (!wallet_address || !small_blind || !big_blind || !password) {
    return sendError(ws, 'Missing required fields');
  }

  try {
    const room_id = createRoom(wallet_address, small_blind, big_blind, password, max_players || 6);
    
    const client = clients.get(ws);
    if (client) {
      client.wallet_address = wallet_address;
      client.room_id = room_id;
    }

    send(ws, {
      type: 'room_created',
      payload: { room_id },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    sendError(ws, 'Failed to create room');
  }
}

async function handleJoinRoom(ws: WebSocket, payload: any) {
  const { wallet_address, room_id, password } = payload;

  if (!wallet_address || !room_id || !password) {
    return sendError(ws, 'Missing required fields');
  }

  const room = getRoom(room_id);
  if (!room) {
    return sendError(ws, 'Room not found');
  }

  if (room.status !== 'active') {
    return sendError(ws, 'Room is closed');
  }

  if (!validateRoomPassword(room_id, password)) {
    return sendError(ws, 'Invalid password');
  }

  const availableSeat = getAvailableSeat(room_id);
  if (availableSeat === null) {
    return sendError(ws, 'Room is full');
  }

  const client = clients.get(ws);
  if (client) {
    client.wallet_address = wallet_address;
    client.room_id = room_id;
  }

  // Add to room clients
  if (!roomClients.has(room_id)) {
    roomClients.set(room_id, new Set());
  }
  roomClients.get(room_id)!.add(ws);

  send(ws, {
    type: 'join_success',
    payload: {
      room_id,
      seat_position: availableSeat,
      room_info: room,
    },
  });

  // Send current game state
  broadcastRoomState(room_id);
}

async function handleBuyIn(ws: WebSocket, payload: any) {
  const { wallet_address, room_id, transaction_signature } = payload;

  if (!wallet_address || !room_id || !transaction_signature) {
    return sendError(ws, 'Missing required fields');
  }

  // TEMPORARY: Test mode bypass
  let isValid = false;
  if (transaction_signature.startsWith('TEST_MODE_')) {
    console.log('⚠️ TEST MODE: Bypassing buy-in transaction verification');
    isValid = true;
  } else {
    // Verify transaction
    isValid = await verifyBuyInTransaction(
      transaction_signature,
      wallet_address,
      FIXED_BUY_IN,
      room_id
    );
  }

  if (!isValid) {
    return sendError(ws, 'Invalid buy-in transaction');
  }

  const availableSeat = getAvailableSeat(room_id);
  if (availableSeat === null) {
    return sendError(ws, 'Room is full');
  }

  // Add player to room with chips
  addPlayerToRoom(wallet_address, room_id, availableSeat, FIXED_BUY_IN);

  send(ws, {
    type: 'buy_in_success',
    payload: {
      seat_position: availableSeat,
      chip_count: FIXED_BUY_IN,
    },
  });

  broadcastToRoom(room_id, {
    type: 'player_joined',
    payload: {
      wallet_address,
      seat_position: availableSeat,
      chip_count: FIXED_BUY_IN,
    },
  });

  // Try to start hand if enough players
  const players = getRoomPlayers(room_id).filter((p: any) => p.is_active);
  if (players.length >= 2) {
    const state = getGameState(room_id);
    if (state && state.hand_stage === 'waiting') {
      setTimeout(() => {
        const newState = startNewHand(room_id);
        if (newState) {
          broadcastRoomState(room_id);
          startActionTimer(room_id);
        }
      }, 3000); // 3 second delay before starting
    }
  }
}

async function handlePlayerAction(ws: WebSocket, payload: any) {
  const { wallet_address, room_id, action } = payload;

  if (!wallet_address || !room_id || !action) {
    return sendError(ws, 'Missing required fields');
  }

  clearActionTimer(room_id);

  const newState = processPlayerAction(room_id, wallet_address, action);
  
  if (!newState) {
    return sendError(ws, 'Invalid action');
  }

  broadcastToRoom(room_id, {
    type: 'player_action_broadcast',
    payload: {
      wallet_address,
      action,
    },
  });

  broadcastRoomState(room_id);

  if (newState.hand_stage === 'waiting') {
    // Hand ended, start new hand after delay
    setTimeout(() => {
      const players = getRoomPlayers(room_id).filter((p: any) => p.is_active && p.chip_count > 0);
      if (players.length >= 2) {
        const nextState = startNewHand(room_id);
        if (nextState) {
          broadcastRoomState(room_id);
          startActionTimer(room_id);
        }
      }
    }, 3000);
  } else {
    startActionTimer(room_id);
  }
}

async function handleCashOut(ws: WebSocket, payload: any) {
  const { wallet_address, room_id, transaction_signature } = payload;

  if (!wallet_address || !room_id) {
    return sendError(ws, 'Missing required fields');
  }

  const player = getPlayerInRoom(wallet_address, room_id);
  if (!player) {
    return sendError(ws, 'Player not in room');
  }

  if (transaction_signature) {
    // Verify cash-out transaction
    const isValid = await verifyCashOutTransaction(
      transaction_signature,
      wallet_address,
      player.chip_count
    );

    if (!isValid) {
      return sendError(ws, 'Invalid cash-out transaction');
    }
  }

  // Remove player from room
  removePlayerFromRoom(wallet_address, room_id);

  send(ws, {
    type: 'cash_out_success',
    payload: {
      amount: player.chip_count,
    },
  });

  broadcastToRoom(room_id, {
    type: 'player_left',
    payload: {
      wallet_address,
    },
  });

  // Remove from room clients
  if (roomClients.has(room_id)) {
    roomClients.get(room_id)!.delete(ws);
  }

  const client = clients.get(ws);
  if (client) {
    client.room_id = undefined;
  }

  broadcastRoomState(room_id);
}

async function handleReconnect(ws: WebSocket, payload: any) {
  const { wallet_address } = payload;

  if (!wallet_address) {
    return sendError(ws, 'Missing wallet address');
  }

  const room_id = findPlayerActiveRoom(wallet_address);
  if (!room_id) {
    return send(ws, {
      type: 'reconnect_failed',
      payload: { message: 'No active room found' },
    });
  }

  const player = getPlayerInRoom(wallet_address, room_id);
  if (!player) {
    return sendError(ws, 'Player not found in room');
  }

  // Update connection status
  updatePlayerConnection(wallet_address, room_id, true);

  const client = clients.get(ws);
  if (client) {
    client.wallet_address = wallet_address;
    client.room_id = room_id;
  }

  // Add to room clients
  if (!roomClients.has(room_id)) {
    roomClients.set(room_id, new Set());
  }
  roomClients.get(room_id)!.add(ws);

  send(ws, {
    type: 'reconnect_success',
    payload: {
      room_id,
      seat_position: player.seat_position,
      chip_count: player.chip_count,
    },
  });

  broadcastRoomState(room_id);
}

async function handleCloseRoom(ws: WebSocket, payload: any) {
  const { wallet_address, room_id } = payload;

  if (!wallet_address || !room_id) {
    return sendError(ws, 'Missing required fields');
  }

  const room = getRoom(room_id);
  if (!room) {
    return sendError(ws, 'Room not found');
  }

  if (room.creator_wallet !== wallet_address) {
    return sendError(ws, 'Only room creator can close the room');
  }

  closeRoom(room_id);

  broadcastToRoom(room_id, {
    type: 'room_closed',
    payload: { message: 'Room has been closed by creator' },
  });

  // Disconnect all clients in room
  if (roomClients.has(room_id)) {
    roomClients.delete(room_id);
  }
}

function handleDisconnect(ws: WebSocket) {
  const client = clients.get(ws);
  if (client && client.wallet_address && client.room_id) {
    updatePlayerConnection(client.wallet_address, client.room_id, false);
    
    if (roomClients.has(client.room_id)) {
      roomClients.get(client.room_id)!.delete(ws);
    }

    broadcastToRoom(client.room_id, {
      type: 'player_disconnected',
      payload: {
        wallet_address: client.wallet_address,
      },
    });
  }

  clients.delete(ws);
}

function broadcastRoomState(room_id: string) {
  const state = getGameState(room_id);
  const players = getRoomPlayers(room_id);
  const room = getRoom(room_id);

  if (!state || !room) return;

  const roomState = {
    room,
    players,
    game_state: {
      ...state,
      // Don't send other players' hole cards
      player_hole_cards: {}, // Will be sent individually
    },
  };

  // Send to each player with their own hole cards
  const roomWs = roomClients.get(room_id);
  if (roomWs) {
    roomWs.forEach((ws) => {
      const client = clients.get(ws);
      if (client && client.wallet_address) {
        const personalizedState = {
          ...roomState,
          game_state: {
            ...roomState.game_state,
            player_hole_cards: {
              [client.wallet_address]: state.player_hole_cards[client.wallet_address] || [],
            },
          },
        };

        send(ws, {
          type: 'room_state',
          payload: personalizedState,
        });
      }
    });
  }
}

function broadcastToRoom(room_id: string, message: any) {
  const roomWs = roomClients.get(room_id);
  if (roomWs) {
    roomWs.forEach((ws) => {
      send(ws, message);
    });
  }
}

function send(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, message: string) {
  send(ws, {
    type: 'error',
    payload: { message },
  });
}

function startActionTimer(room_id: string) {
  clearActionTimer(room_id);

  const timeout = setTimeout(() => {
    const state = getGameState(room_id);
    if (!state || state.current_player_seat === null) return;

    const players = getRoomPlayers(room_id);
    const currentPlayer = players.find((p: any) => p.seat_position === state.current_player_seat);

    if (currentPlayer) {
      // Auto-fold on timeout
      processPlayerAction(room_id, currentPlayer.wallet_address, { type: 'fold' });
      
      broadcastToRoom(room_id, {
        type: 'player_timeout',
        payload: {
          wallet_address: currentPlayer.wallet_address,
        },
      });

      broadcastRoomState(room_id);
      startActionTimer(room_id);
    }
  }, ACTION_TIMEOUT_MS);

  actionTimeouts.set(room_id, timeout);
}

function clearActionTimer(room_id: string) {
  const timeout = actionTimeouts.get(room_id);
  if (timeout) {
    clearTimeout(timeout);
    actionTimeouts.delete(room_id);
  }
}


