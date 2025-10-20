# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Or use the shortcut:
```bash
npm run install:all
```

## 2. Create Escrow Wallet

You need a Solana wallet to act as the escrow for all USDC transactions.

**Option A: Use Solana CLI**
```bash
solana-keygen new --outfile escrow-wallet.json
solana address -k escrow-wallet.json
```

**Option B: Use Phantom Wallet**
- Create a new wallet in Phantom
- Copy the public address

## 3. Environment Configuration

### Server Configuration

Create `server/.env`:
```env
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_WALLET_ADDRESS=YOUR_ESCROW_WALLET_PUBLIC_KEY_HERE
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NODE_ENV=development
```

### Client Configuration

Create `client/.env`:
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 4. Get Devnet Tokens (Testing Only)

### Get Devnet SOL
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

Or use the web faucet: https://faucet.solana.com

### Get Devnet USDC

For testing on devnet, you can:
1. Use SPL Token Faucet: https://spl-token-faucet.com
2. Or create your own test USDC tokens for devnet

## 5. Run the Application

### Development Mode

**Terminal 1 - Server:**
```bash
npm run dev:server
```

**Terminal 2 - Client:**
```bash
npm run dev:client
```

Or run both concurrently:
```bash
npm run dev
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001

## 6. First-Time Usage

1. Install Phantom Wallet extension in your browser
2. Switch Phantom to Devnet (Settings → Developer Settings → Change Network → Devnet)
3. Get some devnet SOL for transaction fees
4. Get devnet USDC tokens (1000+ recommended for testing)
5. Open http://localhost:3000
6. Connect your Phantom wallet
7. Create your first room!

## 7. Testing with Multiple Players

To test with multiple players:

1. Use different browser profiles or browsers
2. Each needs a separate Phantom wallet
3. Each wallet needs devnet SOL and USDC
4. Player 1 creates a room and shares the room ID
5. Player 2+ joins using the room ID and password

## Common Issues

### "Transaction failed" when buying in
- Ensure your wallet is on Devnet
- Check you have enough devnet SOL for fees
- Verify you have at least 1000 USDC in your wallet

### WebSocket connection fails
- Ensure server is running (Terminal 1)
- Check `VITE_WS_URL` in `client/.env`
- Try restarting both server and client

### Room not found
- Verify room ID is correct
- Check server logs for errors
- Ensure database file exists (`server/poker.db`)

### Cards not displaying
- Clear browser cache
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for errors

## Database Reset

To start fresh:
```bash
rm server/poker.db
npm run dev:server  # Will recreate database
```

## Next Steps

- Read the main README.md for detailed documentation
- Check server logs for transaction verification
- Test all game flows (create, join, play, cash out)
- Review security considerations before production use

## Production Deployment

See README.md for detailed deployment instructions for:
- Render (backend)
- Vercel/Netlify (frontend)
- Mainnet configuration

