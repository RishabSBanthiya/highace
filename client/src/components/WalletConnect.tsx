import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  return (
    <div className="flex justify-end p-4">
      <WalletMultiButton className="!bg-white !text-black hover:!bg-gray-200" />
    </div>
  );
}


