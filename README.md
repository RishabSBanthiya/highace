# HighAce Poker

On-chain Texas Hold'em poker on Solana blockchain with Phantom wallet integration.

## Features

- **Private Rooms**: Create and join password-protected poker rooms
- **On-chain Transactions**: Buy-in and cash-out using USDC on Solana
- **Real-time Gameplay**: WebSocket-based real-time game updates
- **Phantom Wallet**: Wallet-based authentication and transactions
- **Auto-reconnect**: Seamlessly rejoin games using your wallet
- **6-Player Tables**: Intimate poker experience with up to 6 players

## Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + WebSocket
- **Database**: SQLite
- **Blockchain**: Solana (Devnet) with direct USDC transfers
- **Wallet**: Phantom via @solana/wallet-adapter

## Prerequisites

- Node.js 18+ and npm
- Phantom Wallet browser extension
- Solana CLI (optional, for creating escrow wallet)

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd highace
npm run install:all
```

### 2. Create Escrow Wallet

Create a new Solana wallet for the escrow:

```bash
solana-keygen new --outfile escrow-wallet.json
solana address -k escrow-wallet.json
```

Save the public key for the next step.

### 3. Configure Environment

Create `server/.env`:

```env
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_WALLET_ADDRESS=<your_escrow_wallet_public_key>
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NODE_ENV=development
```

Create `client/.env`:

```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 4. Fund Escrow with USDC (Devnet)

For devnet testing, you'll need devnet USDC. You can:
1. Get devnet SOL from https://faucet.solana.com
2. Use SPL Token Faucet to get devnet USDC

### 5. Run Development

```bash
# Terminal 1: Start server
npm run dev:server

# Terminal 2: Start client
npm run dev:client
```

Access the app at http://localhost:3000

## Usage

### Creating a Room

1. Connect your Phantom wallet
2. Click "Create Room"
3. Set small blind, big blind, and password
4. Share the room ID with other players

### Joining a Room

1. Connect your Phantom wallet
2. Click "Join Room"
3. Enter room ID and password
4. Sign the buy-in transaction (1000 USDC)
5. Start playing!

### Gameplay

- **Auto-start**: Hands start automatically when 2+ players are ready
- **30s Timer**: Each action has a 30-second timeout
- **Actions**: Fold, Check, Call, Raise
- **Reconnection**: Close and reopen - your seat and chips are preserved

### Cashing Out

1. Click "Cash Out" button
2. Confirm the action
3. Sign the transaction
4. Your chips are converted back to USDC

## Game Rules

- **Texas Hold'em**: Standard rules apply
- **Fixed Buy-in**: 1000 USDC = 1000 chips
- **Blinds**: Configurable per room
- **Max Players**: 6 per table
- **Auto-fold**: Players who timeout are automatically folded

## Deployment

### Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Configure environment variables
5. Deploy!

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy dist/ folder
```

Update `VITE_WS_URL` and `VITE_API_URL` to production URLs.

## Development Notes

### Database

SQLite database is created automatically at `server/poker.db`. Delete this file to reset all data.

### WebSocket

The server uses native WebSocket (ws library). Ensure your hosting supports WebSocket connections.

### Solana Transactions

- All transactions are on Devnet by default
- Change `SOLANA_RPC_URL` to mainnet for production
- Update `USDC_MINT_ADDRESS` for mainnet USDC

## Security Considerations

⚠️ **This is an MVP implementation. For production:**

1. Implement proper escrow smart contract
2. Add server-side signature verification
3. Use encrypted passwords with stronger hashing
4. Add rate limiting and DDoS protection
5. Implement proper session management
6. Add comprehensive error handling
7. Conduct security audit before handling real funds

## Testing

### Manual Testing Checklist

- [ ] Create room with custom blinds
- [ ] Join room with password
- [ ] Buy-in transaction
- [ ] Play full hand (preflop → showdown)
- [ ] Multiple players (2-6)
- [ ] Player timeout and auto-fold
- [ ] Disconnect and reconnect
- [ ] Cash-out transaction
- [ ] Room closure

## Troubleshooting

**WebSocket won't connect**
- Check server is running on port 3001
- Verify VITE_WS_URL in client/.env

**Transaction fails**
- Ensure you have devnet SOL for fees
- Verify USDC token account exists
- Check Phantom wallet is on Devnet

**Cards not displaying**
- Clear browser cache
- Check browser console for errors

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

