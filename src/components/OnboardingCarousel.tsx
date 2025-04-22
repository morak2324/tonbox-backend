import React, { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import Lottie from 'lottie-react';
import { applyReferralCode } from '../firebase/users';

// Import Lottie animations
const slides = [
  {
    title: 'Welcome to Tonbox',
    description: 'Your gateway to earning rewards in the TON ecosystem',
    animation: 'https://lottie.host/c2e6a5c6-b4d9-4b8c-a716-5b1d3d769d2c/UJpDGRxpGi.json',
    gradient: 'from-purple-500/20 via-purple-400/10 to-transparent',
    iconColor: 'text-purple-400'
  },
  {
    title: 'Connect Your Wallet',
    description: 'Link your TON wallet to start earning points and rewards',
    animation: 'https://lottie.host/58cd0d57-9c7c-4426-9f6c-c0498bc96c41/1ZB6Vy3mGI.json',
    gradient: 'from-blue-500/20 via-blue-400/10 to-transparent',
    iconColor: 'text-blue-400'
  },
  {
    title: 'Invite Friends',
    description: 'Earn points by inviting friends to join Tonbox',
    animation: 'https://lottie.host/21f89fc0-90aa-49dc-8fce-f6de0f533c38/PJDuVDrZ1C.json',
    gradient: 'from-green-500/20 via-green-400/10 to-transparent',
    iconColor: 'text-green-400'
  },
  {
    title: 'Claim Rewards',
    description: 'Complete tasks and collect exclusive NFT rewards',
    animation: 'https://lottie.host/a9cc6eb2-5647-4a23-8895-b4c6bc164894/BLjGWbz9Ys.json',
    gradient: 'from-orange-500/20 via-orange-400/10 to-transparent',
    iconColor: 'text-orange-400'
  }
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();

  // Extract and apply referral code
  useEffect(() => {
    const extractAndApplyReferralCode = async () => {
      try {
        // Extract referral code from Telegram WebApp initData
        const initData = new URLSearchParams(window.Telegram.WebApp.initData);
        let refCode = initData.get('start_param') || '';

        // Fallback to URL parameter
        if (!refCode) {
          const urlParams = new URLSearchParams(window.location.search);
          refCode = urlParams.get('ref') || '';
        }

        // Remove "ref_" prefix if present
        if (refCode.startsWith('ref_')) {
          refCode = refCode.replace('ref_', '');
        }

        if (refCode && userId) {
          setReferralCode(refCode);
          await applyReferralCode(userId, refCode);
        }
      } catch (err) {
        console.error('Error applying referral code:', err);
        setError(err instanceof Error ? err.message : 'Failed to apply referral code');
      }
    };

    extractAndApplyReferralCode();
  }, [userId]);

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-4 bg-purple-500'
                  : index < currentSlide
                  ? 'bg-purple-500/50'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Slides */}
        <div className="relative h-[500px]">
          {slides.map((slide, index) => {
            return (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 transform ${
                  index === currentSlide
                    ? 'translate-x-0 opacity-100'
                    : index < currentSlide
                    ? '-translate-x-full opacity-0'
                    : 'translate-x-full opacity-0'
                }`}
              >
                <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-8 h-full border border-purple-500/10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} rounded-3xl`} />
                  
                  <div className="relative flex flex-col items-center justify-center h-full text-center">
                    <div className="w-64 h-64 mb-6">
                      <Lottie
                        animationData={slide.animation}
                        loop={true}
                        className="w-full h-full"
                      />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {slide.title}
                    </h2>
                    
                    <p className="text-gray-400 max-w-xs">
                      {slide.description}
                    </p>

                    {referralCode && index === 0 && (
                      <div className="mt-4 bg-purple-500/20 rounded-xl px-4 py-2">
                        <span className="text-purple-400">
                          Referred by: {referralCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation button */}
        <button
          onClick={handleNext}
          className="w-full mt-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {currentSlide === slides.length - 1 ? (
            'Continue to Game'
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}