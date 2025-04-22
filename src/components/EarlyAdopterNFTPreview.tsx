import React, { useState, useEffect } from 'react';
import { X, Clock, Gift, ArrowRight } from 'lucide-react';
import Lottie from 'lottie-react';
import clockAnimation from '../assets/animations/clock.json';

interface EarlyAdopterNFTPreviewProps {
  onClose: () => void;
  endDate: number;
  isEarlyAdopter: boolean;
  totalClaimed: number;
}

export function EarlyAdopterNFTPreview({ onClose, endDate, isEarlyAdopter, totalClaimed }: EarlyAdopterNFTPreviewProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Don't show if user is already an early adopter or if 5k users have claimed
  if (isEarlyAdopter || totalClaimed >= 5000) {
    return null;
  }

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
        <div className="aspect-square max-h-[50vh] mb-6">
          <Lottie
            animationData={clockAnimation}
            loop={true}
            className="w-full h-full"
          />
        </div>
        
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent mb-2">
              Early Adopter NFT
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Exclusive NFT only available for the first 5,000 early adopters of Tonbox. {5000 - totalClaimed} remaining!
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-semibold">Time Remaining</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">{timeLeft.days}</div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">{timeLeft.hours}</div>
                <div className="text-xs text-gray-400">Hours</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-400">Minutes</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-400">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-400">Seconds</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-2xl font-semibold flex items-center gap-2 group transition-all"
            >
              Complete Early Adopter Tasks
              <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Gift className="w-4 h-4" />
              Invite 7 friends to qualify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}