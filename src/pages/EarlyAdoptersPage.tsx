import React, { useEffect, useState } from 'react';
import { Flame, Award, Trophy, Star, Users, Clock, ExternalLink, Gift } from 'lucide-react';
import { CircularProgress } from '../components/CircularProgress';
import { useCountUp } from '../hooks/useCountUp';
import { useUser } from '../hooks/useUser';
import { useTonAddress } from '@tonconnect/ui-react';
import { completeEarlyAdopter } from '../firebase/tasks';
import { EarlyAdopterNFTPreview } from '../components/EarlyAdopterNFTPreview';
import axios from 'axios';

// Set the end date to 2 weeks from deployment
const END_DATE = new Date('2025-04-28').getTime();

// Helper function to check if we should show NFT preview
const shouldShowNFTPreview = () => {
  const today = new Date().toDateString();
  const previewData = localStorage.getItem('nftPreviewData');
  
  if (!previewData) {
    return true;
  }

  const data = JSON.parse(previewData);
  if (data.date !== today) {
    return true;
  }

  return data.showCount < 2;
};

// Helper function to update preview count
const updatePreviewCount = () => {
  const today = new Date().toDateString();
  const previewData = localStorage.getItem('nftPreviewData');
  
  let data = { date: today, showCount: 1 };
  if (previewData) {
    data = JSON.parse(previewData);
    if (data.date === today) {
      data.showCount++;
    } else {
      data = { date: today, showCount: 1 };
    }
  }
  
  localStorage.setItem('nftPreviewData', JSON.stringify(data));
};

export const EarlyAdoptersPage = () => {
  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, loading: userLoading, isGuest } = useUser(userId);
  const [loading, setLoading] = useState(true);
  const [tonBalance, setTonBalance] = useState<string>('0.00');
  const points = user?.points || 0;
  const displayPoints = useCountUp(points);
  const [progress, setProgress] = useState(0);
  const userAddress = useTonAddress();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [totalUsers, setTotalUsers] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [showNFTPreview, setShowNFTPreview] = useState(false);
  const [pageViewStartTime, setPageViewStartTime] = useState<number | null>(null);

  // Get Telegram user data
  const telegramUser = tg.initDataUnsafe?.user;
  const userPhotoUrl = telegramUser?.photo_url;
  const displayName = telegramUser?.username || telegramUser?.first_name || 'User';

  // Initialize page view timer
  useEffect(() => {
    setPageViewStartTime(Date.now());
  }, []);

  // Handle NFT preview display logic
  useEffect(() => {
    if (!user?.isEarlyAdopter && !showNFTPreview && pageViewStartTime) {
      const timeSpent = Date.now() - pageViewStartTime;
      
      if (timeSpent >= 2000 && shouldShowNFTPreview()) {
        const timer = setTimeout(() => {
          setShowNFTPreview(true);
          updatePreviewCount();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, showNFTPreview, pageViewStartTime]);

  useEffect(() => {
    // Mock total users count - replace with actual API call
    setTotalUsers(Math.floor(Math.random() * 5000) + 3000);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = END_DATE - now;

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
  }, []);

  useEffect(() => {
    const fetchTonBalance = async () => {
      if (!userAddress) return;

      try {
        const response = await axios.get(`https://toncenter.com/api/v2/getAddressBalance?address=${userAddress}`);
        if (response.data.ok) {
          const balanceInTon = (Number(response.data.result) / 1e9).toFixed(2);
          setTonBalance(balanceInTon);
        }
      } catch (error) {
        console.error('Error fetching TON balance:', error);
      }
    };

    fetchTonBalance();
  }, [userAddress]);

  useEffect(() => {
    const duration = 2000;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(nextProgress);

      if (nextProgress < 100) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      setLoading(false);
    }
  }, [userLoading]);

  // Check if user qualifies for early adopter status
  useEffect(() => {
    const checkEarlyAdopterStatus = async () => {
      if (!user || user.isEarlyAdopter || !user.totalInvites) return;

      if (user.totalInvites >= 7) {
        setShowRewardPopup(true);
      }
    };

    checkEarlyAdopterStatus();
  }, [user]);

  const handleClaimReward = async () => {
    if (!userId || claimingReward) return;

    try {
      setClaimingReward(true);
      setClaimError('');

      const result = await completeEarlyAdopter(userId);
      
      if (result.success) {
        setClaimed(true);
        // Close popup after showing success animation
        setTimeout(() => {
          setShowRewardPopup(false);
          window.location.reload(); // Refresh to update UI
        }, 2000);
      } else {
        setClaimError(result.message || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimError('Failed to claim reward. Please try again.');
    } finally {
      setClaimingReward(false);
    }
  };

  // If the time has expired, show expiration message
  if (END_DATE - new Date().getTime() < 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Early Adopters Program Ended</h2>
          <p className="text-gray-400">Thank you for your interest! The early adopters program has ended.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0F] text-white overflow-y-auto pb-24">
      <div className="p-4 max-w-[390px] mx-auto">
        {isGuest && (
          <div className="mb-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl text-sm">
            Running in guest mode - data is stored locally
          </div>
        )}

        {/* Timer Card */}
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6">
          <div className="text-center">
            <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-4">Early Adopters Program Ends In</h2>
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
        </div>

        {/* User Stats Card */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {displayName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Flame className="w-3 h-3 text-orange-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{displayName}</span>
                <span className="text-xs text-gray-400">Level {user?.level || 1}</span>
              </div>
            </div>

            <div className="relative z-10 bg-gradient-to-br from-purple-900/60 to-purple-800/40 rounded-2xl w-36 h-36 mx-auto flex flex-col items-center justify-center border border-purple-500/20 shadow-lg mb-6 glow">
              <CircularProgress progress={progress} square />
              <div className="text-center relative z-10">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent mb-1">
                  {displayPoints.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Total Points</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-gray-400">Achievements</span>
                </div>
                <p className="text-lg font-semibold">{user?.achievements?.toLocaleString() || 0}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Balance</span>
                </div>
                <p className="text-lg font-semibold">{tonBalance} TON</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Total Users</span>
                </div>
                <p className="text-lg font-semibold">{totalUsers.toLocaleString()}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Referrals</span>
                </div>
                <p className="text-lg font-semibold">{user?.totalInvites || 0}/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Early Adopters Requirements */}
        <div className="mt-6 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent mb-4">
            Early Adopters Bonus Requirements
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Refer 7 Friends</h3>
              </div>
              <p className="text-sm text-gray-400">
                Invite 7 friends to be eligible for the early adopters bonus
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min((user?.totalInvites || 0) / 7 * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <a 
                href="https://t.me/your_channel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <i className="fab fa-telegram text-blue-400"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Join Telegram Channel</h3>
                    <p className="text-sm text-gray-400">Stay updated with latest news</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>

              <a 
                href="https://x.com/your_handle" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <i className="fab fa-twitter text-blue-400"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Follow on X (Twitter)</h3>
                    <p className="text-sm text-gray-400">Follow for announcements</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>

              <a 
                href="https://youtube.com/@your_channel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <i className="fab fa-youtube text-red-400"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">Subscribe on YouTube</h3>
                    <p className="text-sm text-gray-400">Watch tutorials and updates</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Early Adopter Reward Popup */}
      {showRewardPopup && (
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
                  Early Adopter Reward!
                </h2>
                <p className="text-gray-400 mt-2">
                  Congratulations! You've completed the early adopters program!
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl p-6 text-center mb-8">
                <p className="text-gray-400 mb-2">Reward Amount</p>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  10,000 Tonbox
                </div>
              </div>

              {claimError && (
                <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl text-sm text-center">
                  {claimError}
                </div>
              )}

              <button
                onClick={handleClaimReward}
                disabled={claimed || claimingReward}
                className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
                  claimed
                    ? 'bg-green-500 cursor-not-allowed'
                    : claimingReward
                    ? 'bg-purple-500/50 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700'
                }`}
              >
                {claimed ? (
                  'Claimed!'
                ) : claimingReward ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Claiming...
                  </div>
                ) : (
                  'Claim 10,000 Tonbox'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early Adopter NFT Preview */}
      {showNFTPreview && (
        <EarlyAdopterNFTPreview
          onClose={() => setShowNFTPreview(false)}
          endDate={END_DATE}
          isEarlyAdopter={!!user?.isEarlyAdopter}
          totalClaimed={5000 - remainingEarlyAdopter}
        />
      )}
    </div>
  );
};