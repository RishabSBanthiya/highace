import { useMemo, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnect from './components/WalletConnect';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import PokerTable from './components/PokerTable';
import { useWebSocket } from './hooks/useWebSocket';
import { WS_URL } from './config';

import '@solana/wallet-adapter-react-ui/styles.css';

function HomePage() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { connected, send, on } = useWebSocket(WS_URL);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    if (!connected) return;

    on('room_created', (payload) => {
      navigate(`/room/${payload.room_id}`);
    });

    on('join_success', (payload) => {
      navigate(`/room/${payload.room_id}`);
    });

    on('error', (payload) => {
      alert(payload.message);
    });
  }, [connected, navigate, on]);

  const handleCreateRoom = (smallBlind: number, bigBlind: number, password: string) => {
    if (!publicKey) {
      alert('Please connect your wallet');
      return;
    }

    send('create_room', {
      wallet_address: publicKey.toBase58(),
      small_blind: smallBlind,
      big_blind: bigBlind,
      password,
      max_players: 6,
    });
  };

  const handleJoinRoom = (roomId: string, password: string) => {
    if (!publicKey) {
      alert('Please connect your wallet');
      return;
    }

    send('join_room', {
      wallet_address: publicKey.toBase58(),
      room_id: roomId,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <WalletConnect />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 text-white">HighAce Poker</h1>
          <p className="text-xl text-gray-400">
            On-chain Texas Hold'em on Solana
          </p>
        </div>

        {!publicKey ? (
          <div className="text-center text-gray-400 text-lg">
            Please connect your Phantom wallet to continue
          </div>
        ) : (
          <>
            <div className="max-w-md mx-auto mb-6">
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 rounded transition ${
                    activeTab === 'create'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Room
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 rounded transition ${
                    activeTab === 'join'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Join Room
                </button>
              </div>
            </div>

            {activeTab === 'create' ? (
              <CreateRoom onCreateRoom={handleCreateRoom} />
            ) : (
              <JoinRoom onJoinRoom={handleJoinRoom} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RoomPage() {
  const navigate = useNavigate();
  const roomId = window.location.pathname.split('/').pop() || '';

  const handleLeave = () => {
    navigate('/');
  };

  return <PokerTable roomId={roomId} onLeave={handleLeave} />;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

