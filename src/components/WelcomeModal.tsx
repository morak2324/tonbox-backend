import React, { useState } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { Wallet, X } from 'lucide-react';
import { WalletAnalysis } from './WalletAnalysis';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function WelcomeModal({ isOpen, onClose, username }: WelcomeModalProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const userAddress = useTonAddress();

  if (!isOpen) return null;

  // If user has connected wallet, show analysis
  if (userAddress && !showAnalysis) {
    setShowAnalysis(true);
  }

  if (showAnalysis) {
    return <WalletAnalysis address={userAddress} onClose={onClose} userId={username} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0F] rounded-3xl max-w-md w-full border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent" />
        
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                Welcome, {username}!
              </h2>
              <p className="text-gray-400">Connect your TON wallet to continue</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Why connect your wallet?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  • View your TON balance and transactions
                </li>
                <li className="flex items-center gap-2">
                  • Access your NFTs and Jettons
                </li>
                <li className="flex items-center gap-2">
                  • Participate in tasks and earn rewards
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <TonConnectButton />
            </div>

            <p className="text-center text-sm text-gray-500">
              You must connect your wallet to use this app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}