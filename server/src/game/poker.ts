import PokerSolver from 'pokersolver';
const { Hand } = PokerSolver;
import db from '../database/schema.js';
import { GameState, PlayerAction } from '../types/index.js';
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { getRoomPlayers, updatePlayerChips, getRoom } from './room.js';

export function getGameState(room_id: string): GameState | null {
  const stmt = db.prepare('SELECT * FROM game_states WHERE room_id = ?');
  const row = stmt.get(room_id) as any;
  
  if (!row) return null;

  return {
    room_id: row.room_id,
    dealer_position: row.dealer_position,
    community_cards: row.community_cards ? JSON.parse(row.community_cards) : [],
    pot: row.pot,
    current_bet: row.current_bet,
    current_player_seat: row.current_player_seat,
    hand_stage: row.hand_stage,
    player_hole_cards: row.player_hole_cards ? JSON.parse(row.player_hole_cards) : {},
    player_bets: row.player_bets ? JSON.parse(row.player_bets) : {},
    last_action_time: row.last_action_time,
  };
}

export function saveGameState(state: GameState): void {
  const stmt = db.prepare(`
    UPDATE game_states 
    SET dealer_position = ?, community_cards = ?, pot = ?, current_bet = ?, 
        current_player_seat = ?, hand_stage = ?, player_hole_cards = ?, 
        player_bets = ?, last_action_time = ?
    WHERE room_id = ?
  `);

  stmt.run(
    state.dealer_position,
    JSON.stringify(state.community_cards),
    state.pot,
    state.current_bet,
    state.current_player_seat,
    state.hand_stage,
    JSON.stringify(state.player_hole_cards),
    JSON.stringify(state.player_bets),
    state.last_action_time,
    state.room_id
  );
}

export function startNewHand(room_id: string): GameState | null {
  const players = getRoomPlayers(room_id).filter((p: any) => p.is_active && p.chip_count > 0);
  
  if (players.length < 2) {
    return null; // Need at least 2 players
  }

  const room = getRoom(room_id);
  if (!room) return null;

  const state = getGameState(room_id);
  if (!state) return null;

  // Move dealer button
  let newDealerPosition = (state.dealer_position + 1) % room.max_players;
  const activeSeatPositions = new Set(players.map((p: any) => p.seat_position));
  
  // Find next active seat for dealer
  let attempts = 0;
  while (!activeSeatPositions.has(newDealerPosition) && attempts < room.max_players) {
    newDealerPosition = (newDealerPosition + 1) % room.max_players;
    attempts++;
  }

  // Create and shuffle deck
  let deck = shuffleDeck(createDeck());

  // Deal hole cards
  const player_hole_cards: Record<string, string[]> = {};
  for (const player of players) {
    const { cards, remaining } = dealCards(deck, 2);
    player_hole_cards[player.wallet_address] = cards;
    deck = remaining;
  }

  // Post blinds
  const player_bets: Record<number, number> = {};
  const activeSeats = players.map((p: any) => p.seat_position).sort((a: number, b: number) => a - b);
  const dealerIndex = activeSeats.indexOf(newDealerPosition);
  
  const smallBlindSeat = activeSeats[(dealerIndex + 1) % activeSeats.length];
  const bigBlindSeat = activeSeats[(dealerIndex + 2) % activeSeats.length];

  const smallBlindPlayer = players.find((p: any) => p.seat_position === smallBlindSeat);
  const bigBlindPlayer = players.find((p: any) => p.seat_position === bigBlindSeat);

  if (smallBlindPlayer) {
    const smallBlindAmount = Math.min(room.small_blind, smallBlindPlayer.chip_count);
    player_bets[smallBlindSeat] = smallBlindAmount;
    updatePlayerChips(smallBlindPlayer.wallet_address, room_id, smallBlindPlayer.chip_count - smallBlindAmount);
  }

  if (bigBlindPlayer) {
    const bigBlindAmount = Math.min(room.big_blind, bigBlindPlayer.chip_count);
    player_bets[bigBlindSeat] = bigBlindAmount;
    updatePlayerChips(bigBlindPlayer.wallet_address, room_id, bigBlindPlayer.chip_count - bigBlindAmount);
  }

  const pot = (player_bets[smallBlindSeat] || 0) + (player_bets[bigBlindSeat] || 0);
  const firstToAct = activeSeats[(dealerIndex + 3) % activeSeats.length];

  const newState: GameState = {
    room_id,
    dealer_position: newDealerPosition,
    community_cards: [],
    pot,
    current_bet: room.big_blind,
    current_player_seat: firstToAct,
    hand_stage: 'preflop',
    player_hole_cards,
    player_bets,
    last_action_time: Date.now(),
  };

  // Store remaining deck for later use (not in DB, keep in memory)
  (newState as any).deck = deck;

  saveGameState(newState);
  return newState;
}

export function processPlayerAction(
  room_id: string,
  wallet_address: string,
  action: PlayerAction
): GameState | null {
  const state = getGameState(room_id);
  if (!state) return null;

  const players = getRoomPlayers(room_id).filter((p: any) => p.is_active);
  const player = players.find((p: any) => p.wallet_address === wallet_address);
  
  if (!player) return null;
  if (state.current_player_seat !== player.seat_position) return null;

  const playerCurrentBet = state.player_bets[player.seat_position] || 0;

  switch (action.type) {
    case 'fold':
      // Remove player from this hand
      const updatedPlayers = players.filter((p: any) => p.wallet_address !== wallet_address);
      
      // If only one player left, they win
      if (updatedPlayers.length === 1) {
        const winner = updatedPlayers[0];
        updatePlayerChips(winner.wallet_address, room_id, winner.chip_count + state.pot);
        
        // Reset for next hand
        state.hand_stage = 'waiting';
        state.pot = 0;
        state.current_bet = 0;
        state.current_player_seat = null;
        state.player_bets = {};
        state.community_cards = [];
        state.player_hole_cards = {};
        saveGameState(state);
        return state;
      }
      break;

    case 'call':
      const callAmount = Math.min(state.current_bet - playerCurrentBet, player.chip_count);
      state.player_bets[player.seat_position] = playerCurrentBet + callAmount;
      state.pot += callAmount;
      updatePlayerChips(wallet_address, room_id, player.chip_count - callAmount);
      break;

    case 'raise':
      if (!action.amount) return null;
      const raiseAmount = Math.min(action.amount, player.chip_count);
      const totalBet = playerCurrentBet + raiseAmount;
      state.player_bets[player.seat_position] = totalBet;
      state.pot += raiseAmount;
      state.current_bet = totalBet;
      updatePlayerChips(wallet_address, room_id, player.chip_count - raiseAmount);
      break;

    case 'check':
      if (playerCurrentBet < state.current_bet) return null; // Can't check if need to call
      break;
  }

  // Move to next player
  const activeSeats = players
    .filter((p: any) => p.wallet_address !== wallet_address || action.type !== 'fold')
    .map((p: any) => p.seat_position)
    .sort((a: number, b: number) => a - b);

  const currentIndex = activeSeats.indexOf(state.current_player_seat!);
  const nextIndex = (currentIndex + 1) % activeSeats.length;
  state.current_player_seat = activeSeats[nextIndex];

  // Check if betting round is complete
  const allBetsEqual = activeSeats.every(seat => 
    (state.player_bets[seat] || 0) === state.current_bet || 
    players.find((p: any) => p.seat_position === seat)?.chip_count === 0
  );

  if (allBetsEqual) {
    advanceHandStage(state);
  }

  state.last_action_time = Date.now();
  saveGameState(state);
  return state;
}

function advanceHandStage(state: GameState): void {
  // Reset betting for new round
  state.current_bet = 0;
  state.player_bets = {};

  switch (state.hand_stage) {
    case 'preflop':
      // Deal flop (3 cards)
      state.community_cards = ['2h', '7d', 'Kc']; // Placeholder - would use deck from memory
      state.hand_stage = 'flop';
      break;
    case 'flop':
      // Deal turn (1 card)
      state.community_cards.push('9s');
      state.hand_stage = 'turn';
      break;
    case 'turn':
      // Deal river (1 card)
      state.community_cards.push('Ah');
      state.hand_stage = 'river';
      break;
    case 'river':
      // Showdown
      state.hand_stage = 'showdown';
      determineWinner(state);
      break;
  }
}

function determineWinner(state: GameState): void {
  const players = getRoomPlayers(state.room_id).filter((p: any) => 
    p.is_active && state.player_hole_cards[p.wallet_address]
  );

  if (players.length === 0) return;

  const hands = players.map((player: any) => {
    const holeCards = state.player_hole_cards[player.wallet_address];
    const allCards = [...holeCards, ...state.community_cards];
    return {
      wallet: player.wallet_address,
      hand: Hand.solve(allCards),
    };
  });

  const winners = Hand.winners(hands.map(h => h.hand));
  const winnerWallets = hands
    .filter(h => winners.includes(h.hand))
    .map(h => h.wallet);

  const winAmount = Math.floor(state.pot / winnerWallets.length);

  for (const wallet of winnerWallets) {
    const player = players.find((p: any) => p.wallet_address === wallet);
    if (player) {
      updatePlayerChips(wallet, state.room_id, player.chip_count + winAmount);
    }
  }

  // Reset for next hand
  state.pot = 0;
  state.current_bet = 0;
  state.current_player_seat = null;
  state.hand_stage = 'waiting';
  state.community_cards = [];
  state.player_hole_cards = {};
  state.player_bets = {};
}


