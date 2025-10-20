import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export async function createBuyInTransaction(
  playerPublicKey: PublicKey,
  escrowWallet: PublicKey,
  usdcMint: PublicKey,
  amount: number,
  roomId: string
): Promise<Transaction> {
  const playerTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    playerPublicKey
  );

  const escrowTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    escrowWallet
  );

  const transaction = new Transaction();

  // Add memo instruction with room ID
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`buy_in:${roomId}`, 'utf-8'),
  });

  // USDC has 6 decimals
  const amountInLamports = amount * 1_000_000;

  const transferInstruction = createTransferInstruction(
    playerTokenAccount,
    escrowTokenAccount,
    playerPublicKey,
    amountInLamports,
    [],
    TOKEN_PROGRAM_ID
  );

  transaction.add(memoInstruction);
  transaction.add(transferInstruction);

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = playerPublicKey;

  return transaction;
}

export async function createCashOutTransaction(
  playerPublicKey: PublicKey,
  escrowWallet: PublicKey,
  usdcMint: PublicKey,
  amount: number,
  roomId: string
): Promise<Transaction> {
  const playerTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    playerPublicKey
  );

  const escrowTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    escrowWallet
  );

  const transaction = new Transaction();

  // Add memo instruction with room ID
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`cash_out:${roomId}`, 'utf-8'),
  });

  // This will be signed by escrow (server-side operation)
  // For now, this is a placeholder - in production, server would create and sign this
  const amountInLamports = amount * 1_000_000;

  const transferInstruction = createTransferInstruction(
    escrowTokenAccount,
    playerTokenAccount,
    escrowWallet,
    amountInLamports,
    [],
    TOKEN_PROGRAM_ID
  );

  transaction.add(memoInstruction);
  transaction.add(transferInstruction);

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = escrowWallet;

  return transaction;
}

export function truncateAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export { connection };


