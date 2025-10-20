import { useState } from 'react';

interface CashOutButtonProps {
  chipCount: number;
  onCashOut: () => void;
  disabled?: boolean;
}

export default function CashOutButton({
  chipCount,
  onCashOut,
  disabled,
}: CashOutButtonProps) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) {
      onCashOut();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`px-6 py-3 rounded font-semibold transition ${
        confirming
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-yellow-600 hover:bg-yellow-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {confirming
        ? `Confirm Cash Out (${chipCount} USDC)`
        : `Cash Out (${chipCount} chips)`}
    </button>
  );
}

