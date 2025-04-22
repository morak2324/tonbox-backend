import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';

interface WalletAnalyzerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: () => void;
  remainingAnalyses: number;
}

export function WalletAnalyzerPopup({ isOpen, onClose, onAnalyze, remainingAnalyses }: WalletAnalyzerPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0F] rounded-3xl max-w-md w-full border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent" />
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-xl transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                Analyze Your Wallet
              </h2>
              <p className="text-gray-400">Discover your TON wallet insights</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-300">
              Want to see detailed insights about your wallet? Our analyzer shows you:
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                • Your NFT collection
              </li>
              <li className="flex items-center gap-2">
                • Transaction history
              </li>
              <li className="flex items-center gap-2">
                • Jetton balances
              </li>
            </ul>

            <div className="mt-4 p-3 bg-purple-500/20 rounded-xl text-sm text-purple-300">
              You have {remainingAnalyses} analysis {remainingAnalyses === 1 ? 'attempt' : 'attempts'} remaining today
            </div>

            <button
              onClick={() => {
                onAnalyze();
                onClose();
              }}
              disabled={remainingAnalyses === 0}
              className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors mt-4"
            >
              {remainingAnalyses > 0 ? 'Try It Now' : 'No attempts remaining today'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}