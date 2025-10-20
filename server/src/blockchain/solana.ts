import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

const ESCROW_WALLET = new PublicKey(process.env.ESCROW_WALLET_ADDRESS || '');
const USDC_MINT = new PublicKey(
  process.env.USDC_MINT_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);

export async function verifyBuyInTransaction(
  signature: string,
  playerWallet: string,
  expectedAmount: number,
  roomId: string
): Promise<boolean> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta || tx.meta.err) {
      console.log('Transaction not found or failed');
      return false;
    }

    // Check if transaction is a token transfer
    const instructions = tx.transaction.message.instructions;
    
    for (const instruction of instructions) {
      if ('parsed' in instruction && instruction.program === 'spl-token') {
        const parsed = instruction.parsed;
        
        if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
          const info = parsed.info;
          
          // Verify destination is escrow wallet
          if (info.destination !== ESCROW_WALLET.toBase58()) {
            continue;
          }

          // Verify source is player's token account
          const amount = parsed.type === 'transferChecked' 
            ? info.tokenAmount.uiAmount 
            : info.amount / 1_000_000; // USDC has 6 decimals

          // Verify amount matches expected
          if (Math.abs(amount - expectedAmount) < 0.01) {
            // Check memo for room ID (optional but recommended)
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying buy-in transaction:', error);
    return false;
  }
}

export async function verifyCashOutTransaction(
  signature: string,
  playerWallet: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta || tx.meta.err) {
      console.log('Transaction not found or failed');
      return false;
    }

    const instructions = tx.transaction.message.instructions;
    
    for (const instruction of instructions) {
      if ('parsed' in instruction && instruction.program === 'spl-token') {
        const parsed = instruction.parsed;
        
        if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
          const info = parsed.info;
          
          // Verify source is escrow wallet
          if (info.source !== ESCROW_WALLET.toBase58()) {
            continue;
          }

          const amount = parsed.type === 'transferChecked' 
            ? info.tokenAmount.uiAmount 
            : info.amount / 1_000_000;

          if (Math.abs(amount - expectedAmount) < 0.01) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying cash-out transaction:', error);
    return false;
  }
}

export function getEscrowWalletAddress(): string {
  return ESCROW_WALLET.toBase58();
}

export function getUSDCMintAddress(): string {
  return USDC_MINT.toBase58();
}


