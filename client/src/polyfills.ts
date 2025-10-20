import { Buffer } from 'buffer/';

// Make Buffer available globally for Solana libraries
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = globalThis;
  (window as any).process = { env: {} };
}

