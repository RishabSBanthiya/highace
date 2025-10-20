import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface JoinRoomProps {
  onJoinRoom: (roomId: string, password: string) => void;
}

export default function JoinRoom({ onJoinRoom }: JoinRoomProps) {
  const { publicKey } = useWallet();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    if (!roomId || !password) {
      alert('Please enter room ID and password');
      return;
    }
    onJoinRoom(roomId, password);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Join Room</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Room ID</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            placeholder="Enter room ID"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition"
          disabled={!publicKey}
        >
          Join Room
        </button>
      </form>
    </div>
  );
}


