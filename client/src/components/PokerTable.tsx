import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { RoomState, PlayerAction } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_URL, API_URL } from '../config';
import PlayerSeat from './PlayerSeat';
import Card from './Card';
import ActionButtons from './ActionButtons';
import BuyInModal from './BuyInModal';
import CashOutButton from './CashOutButton';
import { formatChips } from '../utils/cards';

interface PokerTableProps {
  roomId: string;
  onLeave: () => void;
}

export default function PokerTable({ roomId, onLeave }: PokerTableProps) {
  const { publicKey } = useWallet();
  const { connected, send, on } = useWebSocket(WS_URL);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [escrowWallet, setEscrowWallet] = useState('');
  const [usdcMint, setUsdcMint] = useState('');
  const [error, setError] = useState('');
  const [cashingOut, setCashingOut] = useState(false);

  useEffect(() => {
    // Fetch config
    fetch(`${API_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        setEscrowWallet(data.escrow_wallet);
        setUsdcMint(data.usdc_mint);
      })
      .catch((err) => console.error('Failed to fetch config:', err));
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) return;

    // Try to reconnect first
    send('reconnect', { wallet_address: publicKey.toBase58() });

    // Set up message handlers
    on('reconnect_success', (payload) => {
      console.log('Reconnected to room:', payload);
    });

    on('reconnect_failed', () => {
      // Not reconnecting, show buy-in modal
      setShowBuyIn(true);
    });

    on('room_state', (payload) => {
      setRoomState(payload);
    });

    on('join_success', () => {
      setShowBuyIn(true);
    });

    on('buy_in_success', () => {
      setShowBuyIn(false);
    });

    on('cash_out_success', () => {
      setCashingOut(false);
      onLeave();
    });

    on('player_joined', () => {
      // Room state will be updated via room_state message
    });

    on('player_left', () => {
      // Room state will be updated via room_state message
    });

    on('player_action_broadcast', () => {
      // Room state will be updated via room_state message
    });

    on('player_timeout', (payload) => {
      console.log('Player timed out:', payload.wallet_address);
    });

    on('room_closed', () => {
      alert('Room has been closed');
      onLeave();
    });

    on('error', (payload) => {
      setError(payload.message);
      setTimeout(() => setError(''), 5000);
    });
  }, [connected, publicKey, send, on, onLeave]);

  const handleBuyInComplete = (signature: string) => {
    if (!publicKey) return;
    send('buy_in', {
      wallet_address: publicKey.toBase58(),
      room_id: roomId,
      transaction_signature: signature,
    });
  };

  const handlePlayerAction = (action: PlayerAction) => {
    if (!publicKey) return;
    send('player_action', {
      wallet_address: publicKey.toBase58(),
      room_id: roomId,
      action,
    });
  };

  const handleCashOut = () => {
    if (!publicKey) return;
    setCashingOut(true);
    // In a real implementation, you'd create and sign a cash-out transaction
    // For now, we'll just notify the server
    send('cash_out', {
      wallet_address: publicKey.toBase58(),
      room_id: roomId,
    });
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Connecting to server...</div>
      </div>
    );
  }

  if (showBuyIn && escrowWallet && usdcMint) {
    return (
      <BuyInModal
        roomId={roomId}
        escrowWallet={escrowWallet}
        usdcMint={usdcMint}
        onBuyInComplete={handleBuyInComplete}
        onCancel={onLeave}
      />
    );
  }

  if (!roomState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading room...</div>
      </div>
    );
  }

  const myPlayer = roomState.players.find(
    (p) => p.wallet_address === publicKey?.toBase58()
  );
  const isMyTurn =
    myPlayer &&
    roomState.game_state.current_player_seat === myPlayer.seat_position;

  // Arrange seats in a circle
  const seats = Array.from({ length: roomState.room.max_players }, (_, i) => {
    const player = roomState.players.find((p) => p.seat_position === i);
    return player || null;
  });

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Room: {roomId.slice(0, 8)}...</h1>
          <div className="text-sm text-gray-400">
            Blinds: {roomState.room.small_blind}/{roomState.room.big_blind}
          </div>
        </div>
        {myPlayer && !cashingOut && (
          <CashOutButton
            chipCount={myPlayer.chip_count}
            onCashOut={handleCashOut}
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Main table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-felt rounded-full p-12 relative" style={{ minHeight: '600px' }}>
          {/* Pot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {formatChips(roomState.game_state.pot)}
            </div>
            <div className="text-sm text-gray-300">Pot</div>
            
            {/* Community cards */}
            {roomState.game_state.community_cards.length > 0 && (
              <div className="flex gap-2 mt-4 justify-center">
                {roomState.game_state.community_cards.map((card, idx) => (
                  <Card key={idx} card={card} />
                ))}
              </div>
            )}

            {/* Hand stage */}
            <div className="mt-4 text-lg font-semibold text-white capitalize">
              {roomState.game_state.hand_stage}
            </div>
          </div>

          {/* Player seats arranged in circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {seats.map((player, idx) => {
                const angle = (idx / roomState.room.max_players) * 2 * Math.PI - Math.PI / 2;
                const radius = 45; // percentage
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                const isDealer = idx === roomState.game_state.dealer_position;
                const isCurrent = idx === roomState.game_state.current_player_seat;
                const holeCards =
                  player && roomState.game_state.player_hole_cards[player.wallet_address];
                const currentBet = roomState.game_state.player_bets[idx];

                return (
                  <div
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <PlayerSeat
                      player={player}
                      isDealer={isDealer}
                      isCurrent={isCurrent}
                      holeCards={holeCards}
                      currentBet={currentBet}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {isMyTurn && myPlayer && (
          <div className="mt-6 max-w-md mx-auto">
            <ActionButtons
              onAction={handlePlayerAction}
              currentBet={roomState.game_state.current_bet}
              playerBet={roomState.game_state.player_bets[myPlayer.seat_position] || 0}
              playerChips={myPlayer.chip_count}
            />
          </div>
        )}
      </div>
    </div>
  );
}

