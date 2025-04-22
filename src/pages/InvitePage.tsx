import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Gift, ArrowRight, Share2, Trophy, Star, Zap, Timer, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { applyReferralCode } from '../firebase/users';
import { useTonConnectUI } from '@tonconnect/ui-react';
import Confetti from 'react-confetti';
import Lottie from 'lottie-react';
import giftboxAnimation from '../assets/animations/giftbox.json';
import type { User } from '../types/user';

// Referral tiers configuration
const REFERRAL_TIERS = [
  { invites: 1, reward: 1000, title: 'Bronze', color: 'from-amber-700 to-amber-500' },
  { invites: 3, reward: 2000, title: 'Silver', color: 'from-gray-400 to-gray-300' },
  { invites: 7, reward: 5000, title: 'Gold', color: 'from-yellow-500 to-yellow-400' },
  { invites: 15, reward: 10000, title: 'Platinum', color: 'from-purple-600 to-purple-400' },
  { invites: 25, reward: 20000, title: 'Diamond', color: 'from-blue-500 to-blue-400' },
  { invites: 50, reward: 50000, title: 'Master', color: 'from-red-500 to-red-400' }
];

const POINTS_PER_REFERRAL = 150;
const BOOSTER_PRICE = 0.5; // TON
const BOOSTER_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const OWNER_ADDRESS = 'UQAXXoHQRVRB6cXvgN388lWbyogUvKZI3V4aXAokmEzU38QQ';

export function InvitePage() {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<typeof REFERRAL_TIERS[0] | null>(null);
  const [nextTier, setNextTier] = useState<typeof REFERRAL_TIERS[0] | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [buyingBooster, setBuyingBooster] = useState(false);
  const [boosterActive, setBoosterActive] = useState(false);
  const [boosterEndTime, setBoosterEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showTierAnimation, setShowTierAnimation] = useState(false);
  const [newTierData, setNewTierData] = useState<{
    title: string;
    reward: number;
    color: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, loading: userLoading, isGuest } = useUser(userId);
  const [tonConnectUI] = useTonConnectUI();

  // Check booster status
  useEffect(() => {
    if (!userId) return;

    const checkBooster = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userData?.boosterEndTime && userData.boosterEndTime > Date.now()) {
          setBoosterActive(true);
          setBoosterEndTime(userData.boosterEndTime);
        }
      } catch (error) {
        console.error('Error checking booster:', error);
      }
    };

    checkBooster();
  }, [userId]);

  // Update booster timer
  useEffect(() => {
    if (!boosterEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= boosterEndTime) {
        setBoosterActive(false);
        setBoosterEndTime(null);
        clearInterval(interval);
        return;
      }

      const diff = boosterEndTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [boosterEndTime]);

  // Calculate current and next tier
  useEffect(() => {
    if (user) {
      const invites = user.totalInvites || 0;
      const current = [...REFERRAL_TIERS].reverse().find(tier => invites >= tier.invites) || null;
      const next = REFERRAL_TIERS.find(tier => invites < tier.invites) || null;
      
      setCurrentTier(current);
      setNextTier(next);
    }
  }, [user?.totalInvites]);

  // Check for new tier unlocks
  useEffect(() => {
    if (user?.totalInvites && user.unlockedTiers) {
      const currentTier = REFERRAL_TIERS.findIndex(tier => user.totalInvites >= tier.invites);
      
      if (currentTier >= 0 && !user.unlockedTiers.includes(currentTier)) {
        const tierData = REFERRAL_TIERS[currentTier];
        setNewTierData({
          title: tierData.title,
          reward: tierData.reward,
          color: tierData.color
        });
        setShowTierAnimation(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [user?.totalInvites, user?.unlockedTiers]);

  useEffect(() => {
    const fetchInvitedFriends = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (isGuest) {
          const mockFriends = Array.from({ length: Math.min(user.totalInvites || 0, 3) }, (_, i) => ({
            id: `mock-${i}`,
            username: `Friend${i + 1}`,
            firstName: `Friend ${i + 1}`,
            points: Math.floor(Math.random() * 10000),
            referralCode: 'MOCK123',
            totalInvites: Math.floor(Math.random() * 10),
            level: Math.floor(Math.random() * 10) + 1,
            balance: 0,
            achievements: 0
          }));
          setInvitedFriends(mockFriends);
        } else {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referredBy', '==', userId));
          const querySnapshot = await getDocs(q);
          const friends = querySnapshot.docs.map(doc => doc.data() as User);
          setInvitedFriends(friends);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitedFriends();
  }, [user, isGuest, userId]);

  const handleBuyBooster = async () => {
    if (!userId) {
      setError('User not found');
      return;
    }

    try {
      setBuyingBooster(true);
      setError(null);

      const amountInNano = Math.floor(BOOSTER_PRICE * 1e9);
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: OWNER_ADDRESS,
            amount: amountInNano.toString(),
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      const userRef = doc(db, 'users', userId);
      const endTime = Date.now() + BOOSTER_DURATION;
      await updateDoc(userRef, {
        boosterEndTime: endTime,
        boosterActive: true
      });

      setBoosterActive(true);
      setBoosterEndTime(endTime);
      setShowBoosterModal(false);
    } catch (error) {
      console.error('Error buying booster:', error);
      setError('Failed to purchase booster');
    } finally {
      setBuyingBooster(false);
    }
  };

  const handleShare = async () => {
    if (!user?.referralCode) {
      setError('No referral code available');
      return;
    }

    const botUsername = 'Tonboxxx_bot';
    const referralLink = `https://t.me/${botUsername}?startapp=${user.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Tonbox!',
          text: 'Join me on Tonbox and earn rewards together!',
          url: referralLink
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          setError('Failed to share referral link');
        }
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const handleCopyLink = async () => {
    if (!user?.referralCode) {
      setError('No referral code available');
      return;
    }

    try {
      const botUsername = 'Tonboxxx_bot';
      const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Fallback: Copying failed', err);
          textArea.remove();
          throw new Error('Copying failed');
        }
      }

      setShowCopySuccess(true);
      setError(null);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy referral link');
    }
  };

  const handleSubmitReferralCode = async () => {
    if (!userId || isGuest) {
      setError('Please connect your wallet first');
      return;
    }

    if (!referralCode) {
      setError('Please enter a referral code');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (user?.referredBy) {
        setError('You have already been referred by someone');
        return;
      }

      if (!/^[A-Z0-9]{8}$/.test(referralCode)) {
        setError('Invalid referral code format');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid referral code');
        return;
      }

      const referrer = querySnapshot.docs[0];
      if (referrer.id === userId) {
        setError('Cannot refer yourself');
        return;
      }

      const success = await applyReferralCode(userId, referralCode);
      if (success) {
        setSuccess('Successfully applied referral code! You both received rewards.');
        setReferralCode('');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError('Failed to apply referral code');
      }
    } catch (err) {
      console.error('Error applying referral:', err);
      setError('Failed to process referral');
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0F] text-white overflow-y-auto pb-24">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      <div className="p-4 max-w-[390px] mx-auto">
        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 px-4 py-2 bg-green-500/20 text-green-300 rounded-xl text-sm"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Points Booster Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-500/10 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Points Booster</h2>
                <p className="text-sm text-gray-400">2x referral points for 7 days</p>
              </div>
            </div>
            {boosterActive && (
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">{timeLeft}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: boosterActive ? '100%' : '0%' }}
                transition={{ duration: 1 }}
              />
            </div>
            <span className="text-sm font-medium">
              {boosterActive ? (
                <span className="text-blue-400">Active</span>
              ) : (
                <span className="text-gray-400">Inactive</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Cost:</span>
              <span className="text-white font-medium">{BOOSTER_PRICE} TON</span>
            </div>
            <button
              onClick={() => setShowBoosterModal(true)}
              disabled={boosterActive}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                boosterActive
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {boosterActive ? 'Already Active' : 'Buy Booster'}
            </button>
          </div>
        </motion.div>

        {/* Tier Progress Card */}
        <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  Referral Tier
                </h1>
                <p className="text-sm text-gray-400">
                  {currentTier ? currentTier.title : 'No tier yet'} • {user?.totalInvites || 0} invites
                </p>
              </div>
            </div>

            {nextTier && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Next Tier</span>
                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                    {nextTier.title}
                  </span>
                </div>
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute h-full bg-gradient-to-r ${nextTier.color} rounded-full transition-all duration-500`}
                    style={{
                      width: `${(user?.totalInvites || 0) / nextTier.invites * 100}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {user?.totalInvites || 0}/{nextTier.invites} invites
                  </span>
                  <span className="text-purple-400">
                    +{nextTier.reward.toLocaleString()} points
                  </span>
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-gray-400 mb-2">Your Referral Link</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm text-gray-400 truncate">
                    {user?.referralCode ? `https://t.me/Tonboxxx_bot?startapp=ref_${user.referralCode}` : 'Loading...'}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
                    disabled={!user?.referralCode}
                  >
                    {showCopySuccess ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    disabled={!user?.referralCode}
                  >
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Only show referral code input if user hasn't been referred yet */}
              {!user?.referredBy && !isGuest && (
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
                  <div className="text-xs text-gray-400 mb-2">Enter Friend's Referral Code</div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-gray-500 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      maxLength={8}
                    />
                    <button
                      onClick={handleSubmitReferralCode}
                      disabled={submitting || !referralCode}
                      className="px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Referral Rewards</h2>
          </div>
          <div className="space-y-3">
            {REFERRAL_TIERS.map((tier, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  (user?.totalInvites || 0) >= tier.invites
                    ? 'bg-gradient-to-r ' + tier.color + ' bg-opacity-20'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${
                    (user?.totalInvites || 0) >= tier.invites
                      ? 'text-yellow-400'
                      : 'text-gray-500'
                  }`} />
                  <span className="text-sm">{tier.title}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">{tier.invites} invites</span>
                  <span className="mx-2">•</span>
                  <span className="text-purple-400">+{tier.reward.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invited Friends */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Invited Friends</h2>
            <div className="text-sm text-gray-400">
              {user?.totalInvites || 0} total
            </div>
          </div>

          {invitedFriends.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/5 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No friends invited yet</p>
              <p className="text-sm text-gray-500 mt-1">Share your link to invite friends</p>
              <button
                onClick={handleShare}
                className="mt-4 px-6 py-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors inline-flex items-center gap-2"
              >
                Share Link
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invitedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    {friend.photoUrl ? (
                      <img
                        src={friend.photoUrl}
                        alt={friend.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <span className="text-lg font-semibold">
                          {friend.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {friend.firstName || friend.username || 'User'}
                        </span>
                        <span className="text-xs text-gray-400">Lvl {friend.level}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {friend.points.toLocaleString()} points earned
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booster Purchase Modal */}
      {showBoosterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0A0A0F] rounded-3xl max-w-md w-full border border-blue-500/10 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Purchase Points Booster</h3>
              <p className="text-gray-400 mb-6">
                Double your referral points for 7 days! Instead of {POINTS_PER_REFERRAL} points,
                you'll earn {POINTS_PER_REFERRAL * 2} points per referral.
              </p>

              <div className="bg-blue-500/10 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Cost</span>
                  <span className="text-blue-400 font-medium">{BOOSTER_PRICE} TON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-blue-400 font-medium">7 days</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBoosterModal(false)}
                  className="flex-1 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyBooster}
                  disabled={buyingBooster}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {buyingBooster ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Share Options Modal */}
      {showShareOptions && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowShareOptions(false)}
        >
          <div
            className="bg-[#0A0A0F] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-purple-500/10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Share Referral Link</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (user?.referralCode) {
                      const link = `https://t.me/Tonboxxx_bot?start=${user.referralCode}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join me on Tonbox!')}`, '_blank');
                    }
                    setShowShareOptions(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 transition-colors flex items-center gap-3"
                >
                  <i className="fab fa-telegram text-lg" />
                  Share on Telegram
                </button>
                <button
                  onClick={() => {
                    if (user?.referralCode) {
                      const link = `https://t.me/Tonboxxx_bot?start=${user.referralCode}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me on Tonbox! ' + link)}`, '_blank');
                    }
                    setShowShareOptions(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-400/20 hover:bg-blue-400/30 rounded-xl text-blue-400 transition-colors flex items-center gap-3"
                >
                  <i className="fab fa-twitter text-lg" />
                  Share on Twitter
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 px-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-purple-400 transition-colors flex items-center gap-3"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Up Animation */}
      <AnimatePresence>
        {showTierAnimation && newTierData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center"
            onClick={() => setShowTierAnimation(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-transparent backdrop-blur-xl border border-purple-500/10 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
              
              <div className="relative">
                <div className="w-48 h-48 mx-auto mb-6">
                  <Lottie
                    animationData={giftboxAnimation}
                    loop={true}
                    className="w-full h-full"
                  />
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <Crown className="w-16 h-16 text-yellow-400 mx-auto" />
                  
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      New Tier Unlocked!
                    </h2>
                    <p className={`text-2xl bg-gradient-to-r ${newTierData.color} bg-clip-text text-transparent font-bold`}>
                      {newTierData.title}
                    </p>
                  </div>

                  <div className="mt-6 bg-white/10 rounded-xl p-4">
                    <p className="text-gray-400 mb-2">Reward Earned</p>
                    <p className="text-3xl font-bold text-purple-400">
                      +{newTierData.reward.toLocaleString()} Points
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTierAnimation(false)}
                    className="mt-6 px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold transition-all"
                  >
                    Continue
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}