import { useState, useEffect } from 'react';
import { PlayerAction } from '../types';

interface ActionButtonsProps {
  onAction: (action: PlayerAction) => void;
  currentBet: number;
  playerBet: number;
  playerChips: number;
  disabled?: boolean;
}

export default function ActionButtons({
  onAction,
  currentBet,
  playerBet,
  playerChips,
  disabled,
}: ActionButtonsProps) {
  const [raiseAmount, setRaiseAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (disabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled]);

  const callAmount = currentBet - playerBet;
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && callAmount <= playerChips;
  const canRaise = playerChips > callAmount;

  const handleFold = () => onAction({ type: 'fold' });
  const handleCheck = () => onAction({ type: 'check' });
  const handleCall = () => onAction({ type: 'call' });
  const handleRaise = () => {
    const amount = parseInt(raiseAmount);
    if (amount > 0 && amount <= playerChips) {
      onAction({ type: 'raise', amount });
      setRaiseAmount('');
    }
  };

  if (disabled) {
    return (
      <div className="text-gray-500 text-center py-4">
        Waiting for your turn...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-yellow-500">{timeLeft}s</div>
        <div className="text-sm text-gray-400">Time remaining</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleFold}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition"
        >
          Fold
        </button>

        {canCheck ? (
          <button
            onClick={handleCheck}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
          >
            Check
          </button>
        ) : canCall ? (
          <button
            onClick={handleCall}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition"
          >
            Call {callAmount}
          </button>
        ) : (
          <button
            disabled
            className="px-6 py-3 bg-gray-600 rounded font-semibold opacity-50 cursor-not-allowed"
          >
            Call
          </button>
        )}
      </div>

      {canRaise && (
        <div className="flex gap-2">
          <input
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(e.target.value)}
            placeholder="Raise amount"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-yellow-500"
            min={currentBet + 1}
            max={playerChips}
          />
          <button
            onClick={handleRaise}
            disabled={!raiseAmount || parseInt(raiseAmount) <= 0}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Raise
          </button>
        </div>
      )}
    </div>
  );
}

