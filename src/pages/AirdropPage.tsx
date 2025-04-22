import React, { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import {
  Trophy,
  Star,
  Users,
  Crown,
  TrendingUp,
  Award,
  Sparkles,
  Image as ImageIcon,
  ChevronRight,
  Zap,
  Target,
  Wallet,
  Link,
  Check
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../Firebase';
import Lottie from 'lottie-react';
import starAnimation from '../assets/animations/star.json';
import elixirAnimation from '../assets/animations/elixir.json';
import { FullscreenNFT } from '../components/FullscreenNFT';
import type { User } from '../types/user';

// Level configuration
const LEVEL_CONFIG = [
  { level: 1, points: 0 },
  { level: 2, points: 100000 },
  { level: 3, points: 400000 },
  { level: 4, points: 900000 },
  { level: 5, points: 1600000 },
  { level: 6, points: 2500000 },
  { level: 7, points: 3600000 },
  { level: 8, points: 4900000 },
  { level: 9, points: 6400000 },
  { level: 10, points: 8100000 }
];

// Achievement badges configuration
const ACHIEVEMENT_BADGES = {
  early_adopter: {
    name: 'Early Adopter',
    icon: Star,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20'
  },
  nft_collector: {
    name: 'NFT Collector',
    icon: ImageIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20'
  },
  super_referrer: {
    name: 'Super Referrer',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20'
  }
};

export function AirdropPage() {
  const [selectedNFT, setSelectedNFT] = useState<{
    name: string;
    description: string;
    animation: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [nextLevelProgress, setNextLevelProgress] = useState({
    current: 0,
    target: 0,
    percentage: 0
  });
  const [connecting, setConnecting] = useState(false);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, isGuest } = useUser(userId);
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // Calculate user's level and progress
  useEffect(() => {
    if (user?.points) {
      const currentLevel = LEVEL_CONFIG.findIndex(level => user.points < level.points) - 1;
      const level = Math.max(0, currentLevel);
      const currentLevelPoints = LEVEL_CONFIG[level].points;
      const nextLevelPoints = LEVEL_CONFIG[level + 1]?.points || currentLevelPoints;
      
      setNextLevelProgress({
        current: user.points - currentLevelPoints,
        target: nextLevelPoints - currentLevelPoints,
        percentage: ((user.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
      });
    }
  }, [user?.points]);

  // Fetch user rank
  useEffect(() => {
    const fetchRank = async () => {
      if (!user?.points) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('points', 'desc'));
        const querySnapshot = await getDocs(q);
        
        let rank = 1;
        let found = false;
        querySnapshot.forEach((doc) => {
          if (doc.id === userId) {
            found = true;
          } else if (!found) {
            rank++;
          }
        });

        setUserRank(rank);
        setTotalUsers(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching rank:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [user?.points, userId]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await tonConnectUI.connectWallet();
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (err) {
      console.error('Disconnection error:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentLevel = LEVEL_CONFIG.findIndex(level => (user?.points || 0) < level.points) - 1;
  const level = Math.max(1, currentLevel);

  return (
    <div className="h-full bg-[#0A0A0F] text-white overflow-y-auto pb-24">
      <div className="p-4 max-w-[390px] mx-auto">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.username || 'User'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-purple-500">
                  <span className="text-2xl font-bold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  {user?.username || 'User'}
                </h1>
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400">Level {level}</span>
                  {userRank && (
                    <>
                      <span className="text-gray-600">•</span>
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400">Rank #{userRank}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="bg-white/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Wallet Status</span>
                </div>
                {userAddress ? (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    Connected
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Not Connected</div>
                )}
              </div>
              {userAddress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-purple-400 font-mono">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Wallet
                      <Link className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Level Progress */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progress to Level {level + 1}</span>
                <span className="text-sm text-purple-400">
                  {nextLevelProgress.current.toLocaleString()} / {nextLevelProgress.target.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${nextLevelProgress.percentage}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Points</span>
                </div>
                <p className="text-lg font-semibold">{user?.points?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Invites</span>
                </div>
                <p className="text-lg font-semibold">{user?.totalInvites || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Goals</span>
                </div>
                <p className="text-lg font-semibold">{user?.achievements || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Achievements</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(ACHIEVEMENT_BADGES).map(([id, badge]) => {
              const isUnlocked = user?.unlockedAchievements?.includes(id);
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isUnlocked ? badge.bgColor : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <badge.icon className={`w-5 h-5 ${isUnlocked ? badge.color : 'text-gray-500'}`} />
                    <span className={isUnlocked ? 'text-white' : 'text-gray-400'}>
                      {badge.name}
                    </span>
                  </div>
                  {isUnlocked && <Sparkles className={`w-4 h-4 ${badge.color}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* NFT Collection */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">NFT Collection</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {user?.claimedArtifacts?.includes('early-adopter') && (
              <div
                className="aspect-square bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl overflow-hidden cursor-pointer relative group"
                onClick={() => setSelectedNFT({
                  name: 'Rare Artifact',
                  description: 'Early Adopter NFT',
                  animation: starAnimation
                })}
              >
                <Lottie
                  animationData={starAnimation}
                  loop={true}
                  className="w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
            {user?.claimedArtifacts?.includes('limited-star') && (
              <div
                className="aspect-square bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl overflow-hidden cursor-pointer relative group"
                onClick={() => setSelectedNFT({
                  name: 'Limited Star',
                  description: 'Limited Edition Star NFT',
                  animation: elixirAnimation
                })}
              >
                <Lottie
                  animationData={elixirAnimation}
                  loop={true}
                  className="w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen NFT View */}
      {selectedNFT && (
        <FullscreenNFT
          name={selectedNFT.name}
          description={selectedNFT.description}
          animation={selectedNFT.animation}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </div>
  );
}