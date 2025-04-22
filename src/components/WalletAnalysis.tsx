import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownRight, ArrowUpRight, Clock, Gift, Star } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import type { Transaction, Jetton, NFT } from '../types/ton';

interface WalletAnalysisProps {
  address: string;
  onComplete: (points: number) => Promise<void>;
}

export function WalletAnalysis({ address, onComplete }: WalletAnalysisProps) {
  const [stats, setStats] = useState<{
    totalReceived: number;
    totalSent: number;
    walletAge: string;
    totalTransactions: number;
  }>({
    totalReceived: 0,
    totalSent: 0,
    walletAge: '',
    totalTransactions: 0
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [rewardPoints, setRewardPoints] = useState({
    agePoints: 0,
    transactionPoints: 0,
    volumePoints: 0,
    total: 0
  });
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState('');

  const displayReceived = useCountUp(stats.totalReceived);
  const displaySent = useCountUp(stats.totalSent);
  const displayRewardPoints = useCountUp(rewardPoints.total);

  const calculateRewardPoints = (stats: {
    totalReceived: number;
    totalSent: number;
    totalTransactions: number;
    walletAge: string;
  }, firstTxTime: number) => {
    // Calculate age in days from first transaction timestamp
    const now = Date.now() / 1000; // Convert to seconds to match transaction timestamp
    const ageInDays = Math.floor((now - firstTxTime) / (24 * 60 * 60));
    
    // Points for wallet age (up to 1000 points)
    const agePoints = Math.min(Math.floor(ageInDays * 2), 1000);

    // Points for transaction count (5 points per transaction, up to 2000 points)
    const transactionPoints = Math.min(stats.totalTransactions * 5, 2000);

    // Points for transaction volume (1 point per TON, up to 2000 points)
    const volumePoints = Math.min(
      Math.floor((stats.totalReceived + stats.totalSent) * 1),
      2000
    );

    return {
      agePoints,
      transactionPoints,
      volumePoints,
      total: agePoints + transactionPoints + volumePoints
    };
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [txResponse, jettonsResponse, nftsResponse] = await Promise.all([
          axios.get(
            `https://tonapi.io/v2/blockchain/accounts/${address}/transactions`,
            {
              headers: {
                'Authorization': 'Bearer AHHHPUIBDR7WLEQAAAABTK3YPC5IN3WNWPUZCPLZLMACOGDU4EEKCRCZJ2D2KMMWD3NT7KY'
              }
            }
          ),
          axios.get(
            `https://tonapi.io/v2/accounts/${address}/jettons`,
            {
              headers: {
                'Authorization': 'Bearer AHHHPUIBDR7WLEQAAAABTK3YPC5IN3WNWPUZCPLZLMACOGDU4EEKCRCZJ2D2KMMWD3NT7KY'
              }
            }
          ),
          axios.get(
            `https://tonapi.io/v2/accounts/${address}/nfts`,
            {
              headers: {
                'Authorization': 'Bearer AHHHPUIBDR7WLEQAAAABTK3YPC5IN3WNWPUZCPLZLMACOGDU4EEKCRCZJ2D2KMMWD3NT7KY'
              }
            }
          )
        ]);

        const transactions = txResponse.data.transactions || [];
        let received = 0;
        let sent = 0;
        let firstTxTime = Date.now() / 1000; // Initialize with current timestamp in seconds

        transactions.forEach((tx: Transaction) => {
          if (tx.in_msg?.value) {
            received += Number(tx.in_msg.value) / 1e9;
          }
          if (tx.out_msgs) {
            tx.out_msgs.forEach((msg) => {
              if (msg.value) {
                sent += Number(msg.value) / 1e9;
              }
            });
          }
          // Find earliest transaction time
          if (tx.utime < firstTxTime) {
            firstTxTime = tx.utime;
          }
        });

        // Calculate wallet age string for display
        const now = Date.now() / 1000;
        const ageInDays = Math.floor((now - firstTxTime) / (24 * 60 * 60));
        let walletAge = '';

        if (ageInDays < 1) {
          walletAge = 'Less than a day old';
        } else if (ageInDays < 30) {
          walletAge = `${ageInDays} days old`;
        } else if (ageInDays < 365) {
          const months = Math.floor(ageInDays / 30);
          walletAge = `${months} month${months > 1 ? 's' : ''} old`;
        } else {
          const years = Math.floor(ageInDays / 365);
          const months = Math.floor((ageInDays % 365) / 30);
          walletAge = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months > 1 ? 's' : ''}` : ''} old`;
        }

        const newStats = {
          totalReceived: received,
          totalSent: sent,
          walletAge,
          totalTransactions: transactions.length
        };

        setStats(newStats);
        const points = calculateRewardPoints(newStats, firstTxTime);
        setRewardPoints(points);
        setLoading(false);

        // Show reward screen after analysis
        setTimeout(() => {
          setShowReward(true);
        }, 9000);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [address]);

  useEffect(() => {
    if (!showReward) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 3);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showReward]);

  const handleClaimReward = async () => {
    if (claimed) return;
    
    try {
      setClaimError('');
      
      // Call the onComplete callback with the total points
      await onComplete(rewardPoints.total);
      
      setClaimed(true);
      
      // Close modal after showing success animation
      setTimeout(() => {
        window.location.reload(); // Refresh the page to update UI
      }, 2000);
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimError('Failed to claim reward. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#0A0A0F] rounded-3xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Analyzing your wallet...</p>
        </div>
      </div>
    );
  }

  if (showReward) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0A0A0F] rounded-3xl max-w-md w-full mx-auto overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden">
            {claimed && Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-celebration"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          
          <div className="p-6 relative">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                Wallet Analysis Reward
              </h2>
              <p className="text-gray-400 mt-2">You've earned points based on your wallet activity!</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Age Bonus</span>
                </div>
                <span className="font-bold text-purple-400">+{rewardPoints.agePoints}</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Transaction Bonus</span>
                </div>
                <span className="font-bold text-blue-400">+{rewardPoints.transactionPoints}</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Volume Bonus</span>
                </div>
                <span className="font-bold text-yellow-400">+{rewardPoints.volumePoints}</span>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl p-6 text-center">
                <p className="text-gray-400 mb-2">Total Reward</p>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  {displayRewardPoints} Points
                </div>
              </div>
            </div>

            {claimError && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl text-sm text-center">
                {claimError}
              </div>
            )}

            <button
              onClick={handleClaimReward}
              disabled={claimed}
              className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
                claimed
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700'
              }`}
            >
              {claimed ? 'Claimed!' : 'Claim Reward'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const slides = [
    {
      title: 'Total Received',
      value: displayReceived.toFixed(2),
      icon: <ArrowDownRight className="w-6 h-6 text-green-400" />,
      color: 'from-green-500/20 to-green-500/5',
      textColor: 'text-green-400'
    },
    {
      title: 'Total Sent',
      value: displaySent.toFixed(2),
      icon: <ArrowUpRight className="w-6 h-6 text-red-400" />,
      color: 'from-red-500/20 to-red-500/5',
      textColor: 'text-red-400'
    },
    {
      title: 'Wallet Age',
      value: stats.walletAge,
      icon: <Clock className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/20 to-purple-500/5',
      textColor: 'text-purple-400'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0F] rounded-3xl max-w-md w-full mx-auto overflow-hidden relative">
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              Wallet Analysis Complete
            </h2>
            <p className="text-gray-400 mt-2">Here's what we found</p>
          </div>

          <div className="relative h-48">
            {slides.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-all duration-500 transform ${
                  index === currentSlide
                    ? 'translate-x-0 opacity-100'
                    : index < currentSlide
                    ? '-translate-x-full opacity-0'
                    : 'translate-x-full opacity-0'
                }`}
              >
                <div className={`bg-gradient-to-br ${slide.color} rounded-2xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center justify-center mb-4">
                      {slide.icon}
                    </div>
                    <h3 className="text-gray-400 text-sm mb-2">{slide.title}</h3>
                    <div className={`text-3xl font-bold ${slide.textColor}`}>
                      {slide.title.includes('TON') ? `${slide.value} TON` : slide.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-purple-500 w-4' : 'bg-gray-600'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}