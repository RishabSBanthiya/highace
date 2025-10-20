import { Player } from '../types';
import { truncateAddress } from '../utils/solana';
import { formatChips } from '../utils/cards';
import Card from './Card';

interface PlayerSeatProps {
  player: Player | null;
  isDealer: boolean;
  isCurrent: boolean;
  holeCards?: string[];
  currentBet?: number;
}

export default function PlayerSeat({
  player,
  isDealer,
  isCurrent,
  holeCards,
  currentBet,
}: PlayerSeatProps) {
  if (!player) {
    return (
      <div className="w-32 h-40 bg-gray-800 bg-opacity-50 rounded-lg border-2 border-gray-700 border-dashed flex items-center justify-center">
        <span className="text-gray-600 text-sm">Empty</span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-40 p-3 rounded-lg border-2 ${
        isCurrent
          ? 'bg-yellow-900 bg-opacity-40 border-yellow-500'
          : 'bg-gray-800 bg-opacity-70 border-gray-600'
      }`}
    >
      {isDealer && (
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-black text-sm border-2 border-gray-400">
          D
        </div>
      )}
      
      <div className="text-xs text-gray-300 truncate mb-1">
        {truncateAddress(player.wallet_address)}
      </div>
      
      <div className="text-lg font-bold text-white mb-2">
        {formatChips(player.chip_count)}
      </div>

      {holeCards && holeCards.length > 0 && (
        <div className="flex gap-1 mb-2">
          {holeCards.map((card, idx) => (
            <Card key={idx} card={card} />
          ))}
        </div>
      )}

      {currentBet !== undefined && currentBet > 0 && (
        <div className="text-sm text-green-400 font-semibold">
          Bet: {formatChips(currentBet)}
        </div>
      )}

      {!player.connected && (
        <div className="text-xs text-red-400 mt-1">Disconnected</div>
      )}
    </div>
  );
}


