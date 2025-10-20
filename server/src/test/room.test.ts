import { describe, it, expect, beforeEach } from 'vitest';
import { createRoom, getRoom, validateRoomPassword, getAvailableSeat, addPlayerToRoom } from '../game/room.js';
import { initializeDatabase } from '../database/schema.js';

describe('Room Management', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  it('should create a room', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123');
    expect(roomId).toBeDefined();
    expect(roomId.length).toBeGreaterThan(0);
  });

  it('should retrieve a room', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123');
    const room = getRoom(roomId);
    
    expect(room).toBeDefined();
    expect(room?.creator_wallet).toBe('test-wallet');
    expect(room?.small_blind).toBe(10);
    expect(room?.big_blind).toBe(20);
  });

  it('should validate correct password', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123');
    const isValid = validateRoomPassword(roomId, 'password123');
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123');
    const isValid = validateRoomPassword(roomId, 'wrong-password');
    expect(isValid).toBe(false);
  });

  it('should find available seats', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123', 6);
    const seat1 = getAvailableSeat(roomId);
    expect(seat1).toBe(0);

    addPlayerToRoom('player1', roomId, 0, 1000);
    const seat2 = getAvailableSeat(roomId);
    expect(seat2).toBe(1);
  });

  it('should return null when room is full', () => {
    const roomId = createRoom('test-wallet', 10, 20, 'password123', 2);
    addPlayerToRoom('player1', roomId, 0, 1000);
    addPlayerToRoom('player2', roomId, 1, 1000);
    
    const seat = getAvailableSeat(roomId);
    expect(seat).toBeNull();
  });
});

