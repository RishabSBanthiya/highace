import { getCardDisplay } from '../utils/cards';

interface CardProps {
  card: string;
  faceDown?: boolean;
}

export default function Card({ card, faceDown }: CardProps) {
  if (faceDown) {
    return (
      <div className="w-16 h-24 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center shadow-lg">
        <div className="text-blue-700 text-2xl">🂠</div>
      </div>
    );
  }

  const { rank, suit, color } = getCardDisplay(card);

  return (
    <div className="w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center shadow-lg border-2 border-gray-300">
      <div className="text-3xl font-bold" style={{ color }}>
        {rank}
      </div>
      <div className="text-3xl" style={{ color }}>
        {suit}
      </div>
    </div>
  );
}


