// Card deck management for poker
const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function createDeck(): string[] {
  const deck: string[] = [];
  for (const rank of ranks) {
    for (const suit of suits) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

export function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: string[], count: number): { cards: string[], remaining: string[] } {
  const cards = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { cards, remaining };
}


