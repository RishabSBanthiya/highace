# Quick Start - HighAce Poker

Get up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Phantom Wallet browser extension installed
- [ ] Git installed

## Step 1: Install (1 min)

```bash
# Clone the repo
git clone <your-repo>
cd highace

# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Step 2: Configure (2 min)

### Create Escrow Wallet

**Quick method - Use any Solana address for testing:**
```
Use: 11111111111111111111111111111111
```

**Proper method:**
```bash
solana-keygen new --outfile escrow-wallet.json
solana address -k escrow-wallet.json
```

### Server Config

Create `server/.env`:
```env
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_WALLET_ADDRESS=11111111111111111111111111111111
USDC_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NODE_ENV=development
```

### Client Config

Create `client/.env`:
```env
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Step 3: Get Test Tokens (1 min)

1. Switch Phantom to Devnet:
   - Open Phantom
   - Settings → Developer Settings
   - Change Network → Devnet

2. Get SOL:
   ```bash
   solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
   ```
   Or: https://faucet.solana.com

3. Get USDC (devnet):
   - https://spl-token-faucet.com
   - Request at least 2000 USDC for testing

## Step 4: Run (1 min)

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client  
npm run dev:client
```

## Step 5: Play! (30 sec)

1. Open http://localhost:3000
2. Connect Phantom wallet
3. Create a room:
   - Small blind: 10
   - Big blind: 20
   - Password: test123
4. Copy room ID
5. Open in another browser/profile
6. Join with room ID and password
7. Both players buy-in (1000 USDC)
8. Play poker! 🎰

## Troubleshooting

**"Transaction failed"**
```bash
# Check Phantom is on Devnet
# Verify you have SOL for fees
solana balance YOUR_ADDRESS --url devnet
```

**"WebSocket won't connect"**
```bash
# Check server is running
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

**"Invalid password"**
- Passwords are case-sensitive
- No special characters in first version

**"Room not found"**
- Copy the full room ID
- Check server terminal for errors

## Testing Commands

```bash
# Run tests
cd server
npm test

# Check server health
curl http://localhost:3001/health

# Check config
curl http://localhost:3001/api/config

# Reset database
rm server/poker.db
npm run dev:server
```

## Default Values for Testing

```
Small Blind: 10
Big Blind: 20
Password: test123
Max Players: 6
Buy-in: 1000 USDC (fixed)
```

## Common Commands

```bash
# Install everything
npm run install:all

# Run both server and client
npm run dev

# Run only server
npm run dev:server

# Run only client
npm run dev:client

# Build for production
npm run build

# Reset database
rm server/poker.db
```

## Quick Architecture Overview

```
Client (Port 3000) ←→ WebSocket ←→ Server (Port 3001)
       ↓                                    ↓
   Phantom Wallet                      SQLite DB
       ↓                                    ↓
   Solana Devnet ←─── USDC Transfers ──────┘
```

## What's Next?

- Read IMPLEMENTATION.md for detailed features
- Check README.md for full documentation
- Review SETUP.md for production deployment
- Explore the codebase in `client/src` and `server/src`

## Need Help?

1. Check the error message in browser console (F12)
2. Check server terminal for backend errors
3. Verify all environment variables are set
4. Ensure Phantom is on Devnet
5. Try resetting the database: `rm server/poker.db`

---

**Happy Playing! 🎲🃏**

For detailed documentation, see:
- IMPLEMENTATION.md - Complete feature list
- README.md - Comprehensive guide
- SETUP.md - Detailed setup instructions

