import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createBuyInTransaction } from '../utils/solana';
import { FIXED_BUY_IN } from '../config';

interface BuyInModalProps {
  roomId: string;
  escrowWallet: string;
  usdcMint: string;
  onBuyInComplete: (signature: string) => void;
  onCancel: () => void;
}

export default function BuyInModal({
  roomId,
  escrowWallet,
  usdcMint,
  onBuyInComplete,
  onCancel,
}: BuyInModalProps) {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyIn = async () => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transaction = await createBuyInTransaction(
        publicKey,
        new PublicKey(escrowWallet),
        new PublicKey(usdcMint),
        FIXED_BUY_IN,
        roomId
      );

      const signed = await signTransaction(transaction);
      const signature = await (window as any).solana.sendTransaction(signed, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      onBuyInComplete(signature);
    } catch (err: any) {
      console.error('Buy-in error:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Buy In</h2>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            You need to buy chips to join this table.
          </p>
          <div className="text-3xl font-bold text-green-500 mb-2">
            {FIXED_BUY_IN} USDC
          </div>
          <p className="text-sm text-gray-400">
            This will be converted to {FIXED_BUY_IN} chips at the table.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBuyIn}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Buy In'}
          </button>
        </div>
      </div>
    </div>
  );
}

