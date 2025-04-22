import React from 'react';
import { X } from 'lucide-react';
import Lottie from 'lottie-react';

interface FullscreenNFTProps {
  name: string;
  description: string;
  animation: any;
  onClose: () => void;
}

export function FullscreenNFT({ name, description, animation, onClose }: FullscreenNFTProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent" />
      
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors z-10"
      >
        <X className="w-6 h-6 text-gray-400" />
      </button>

      <div className="relative w-full max-w-2xl p-4 animate-fade-up">
        <div className="aspect-square max-h-[70vh] mb-6">
          <Lottie
            animationData={animation}
            loop={true}
            className="w-full h-full"
          />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
            {name}
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}