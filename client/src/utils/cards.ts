// Card display utilities
const suitSymbols: Record<string, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const suitColors: Record<string, string> = {
  h: '#ef4444', // red
  d: '#ef4444', // red
  c: '#000000', // black
  s: '#000000', // black
};

export function getCardDisplay(card: string): { rank: string; suit: string; color: string } {
  if (card.length < 2) return { rank: '', suit: '', color: '#000' };
  
  const rank = card[0];
  const suit = card[1].toLowerCase();
  
  return {
    rank,
    suit: suitSymbols[suit] || suit,
    color: suitColors[suit] || '#000',
  };
}

export function formatChips(amount: number): string {
  return amount.toLocaleString();
}


