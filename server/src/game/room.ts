import db from '../database/schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../types/index.js';

export function createRoom(
  creator_wallet: string,
  small_blind: number,
  big_blind: number,
  password: string,
  max_players: number = 6
): string {
  const room_id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  const created_at = Date.now();

  const stmt = db.prepare(`
    INSERT INTO rooms (id, creator_wallet, small_blind, big_blind, max_players, password_hash, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  stmt.run(room_id, creator_wallet, small_blind, big_blind, max_players, password_hash, created_at);

  // Initialize game state
  const gameStmt = db.prepare(`
    INSERT INTO game_states (room_id, dealer_position, pot, current_bet, hand_stage)
    VALUES (?, 0, 0, 0, 'waiting')
  `);
  gameStmt.run(room_id);

  return room_id;
}

export function getRoom(room_id: string): Room | null {
  const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
  const room = stmt.get(room_id) as Room | undefined;
  return room || null;
}

export function validateRoomPassword(room_id: string, password: string): boolean {
  const room = getRoom(room_id);
  if (!room) return false;
  return bcrypt.compareSync(password, room.password_hash);
}

export function closeRoom(room_id: string): void {
  const stmt = db.prepare('UPDATE rooms SET status = ? WHERE id = ?');
  stmt.run('closed', room_id);
}

export function getRoomPlayers(room_id: string) {
  const stmt = db.prepare('SELECT * FROM players WHERE room_id = ? ORDER BY seat_position');
  return stmt.all(room_id);
}

export function getAvailableSeat(room_id: string): number | null {
  const room = getRoom(room_id);
  if (!room) return null;

  const players = getRoomPlayers(room_id);
  const occupiedSeats = new Set(players.map((p: any) => p.seat_position));

  for (let seat = 0; seat < room.max_players; seat++) {
    if (!occupiedSeats.has(seat)) {
      return seat;
    }
  }

  return null;
}

export function addPlayerToRoom(
  wallet_address: string,
  room_id: string,
  seat_position: number,
  chip_count: number
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO players (wallet_address, room_id, seat_position, chip_count, session_start_balance, is_active, connected)
    VALUES (?, ?, ?, ?, ?, 1, 1)
  `);
  stmt.run(wallet_address, room_id, seat_position, chip_count, chip_count);
}

export function removePlayerFromRoom(wallet_address: string, room_id: string): void {
  const stmt = db.prepare('DELETE FROM players WHERE wallet_address = ? AND room_id = ?');
  stmt.run(wallet_address, room_id);
}

export function updatePlayerChips(wallet_address: string, room_id: string, chip_count: number): void {
  const stmt = db.prepare('UPDATE players SET chip_count = ? WHERE wallet_address = ? AND room_id = ?');
  stmt.run(chip_count, wallet_address, room_id);
}

export function updatePlayerConnection(wallet_address: string, room_id: string, connected: boolean): void {
  const stmt = db.prepare('UPDATE players SET connected = ? WHERE wallet_address = ? AND room_id = ?');
  stmt.run(connected ? 1 : 0, wallet_address, room_id);
}

export function getPlayerInRoom(wallet_address: string, room_id: string) {
  const stmt = db.prepare('SELECT * FROM players WHERE wallet_address = ? AND room_id = ?');
  return stmt.get(wallet_address, room_id);
}

export function findPlayerActiveRoom(wallet_address: string): string | null {
  const stmt = db.prepare(`
    SELECT room_id FROM players 
    WHERE wallet_address = ? AND is_active = 1
    LIMIT 1
  `);
  const result = stmt.get(wallet_address) as any;
  return result?.room_id || null;
}


