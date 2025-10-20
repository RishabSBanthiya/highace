import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../poker.db');
export const db = new Database(dbPath);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      creator_wallet TEXT NOT NULL,
      small_blind INTEGER NOT NULL,
      big_blind INTEGER NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 6,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS players (
      wallet_address TEXT NOT NULL,
      room_id TEXT NOT NULL,
      seat_position INTEGER NOT NULL,
      chip_count INTEGER NOT NULL,
      session_start_balance INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      connected INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (wallet_address, room_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS game_states (
      room_id TEXT PRIMARY KEY,
      dealer_position INTEGER NOT NULL,
      community_cards TEXT,
      pot INTEGER NOT NULL DEFAULT 0,
      current_bet INTEGER NOT NULL DEFAULT 0,
      current_player_seat INTEGER,
      hand_stage TEXT NOT NULL DEFAULT 'waiting',
      player_hole_cards TEXT,
      player_bets TEXT,
      last_action_time INTEGER,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
    CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
  `);
  
  console.log('Database initialized successfully');
}

export default db;


