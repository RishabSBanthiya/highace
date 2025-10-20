import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface CreateRoomProps {
  onCreateRoom: (smallBlind: number, bigBlind: number, password: string) => void;
}

export default function CreateRoom({ onCreateRoom }: CreateRoomProps) {
  const { publicKey } = useWallet();
  const [smallBlind, setSmallBlind] = useState('10');
  const [bigBlind, setBigBlind] = useState('20');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    if (!password) {
      alert('Please enter a password');
      return;
    }
    onCreateRoom(parseInt(smallBlind), parseInt(bigBlind), password);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Create Room</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Small Blind</label>
          <input
            type="number"
            value={smallBlind}
            onChange={(e) => setSmallBlind(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Big Blind</label>
          <input
            type="number"
            value={bigBlind}
            onChange={(e) => setBigBlind(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Room Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            required
          />
        </div>
        <div className="text-sm text-gray-400">
          Buy-in: 1000 USDC (fixed)
        </div>
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition"
          disabled={!publicKey}
        >
          Create Room
        </button>
      </form>
    </div>
  );
}


