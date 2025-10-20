export interface Room {
  id: string;
  creator_wallet: string;
  small_blind: number;
  big_blind: number;
  max_players: number;
  password_hash: string;
  created_at: number;
  status: 'active' | 'closed';
}

export interface Player {
  wallet_address: string;
  room_id: string;
  seat_position: number;
  chip_count: number;
  session_start_balance: number;
  is_active: boolean;
  connected: boolean;
}

export interface GameState {
  room_id: string;
  dealer_position: number;
  community_cards: string[];
  pot: number;
  current_bet: number;
  current_player_seat: number | null;
  hand_stage: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  player_hole_cards: Record<string, string[]>;
  player_bets: Record<number, number>;
  last_action_time: number | null;
}

export interface PlayerAction {
  type: 'fold' | 'call' | 'raise' | 'check';
  amount?: number;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export const FIXED_BUY_IN = 1000; // 1000 USDC = 1000 chips


