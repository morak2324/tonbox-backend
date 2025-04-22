import React, { useState, useEffect } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { getUser } from '../firebase/users';
import { useSearchParams } from 'react-router-dom'; // Import for extracting URL params
import type { User } from '../types/user';

export function InvitePage() {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, loading: userLoading, isGuest } = useUser(userId);

  // Extract startapp parameter from URL
  const [searchParams] = useSearchParams();
  const startAppParam = searchParams.get('startapp');

  useEffect(() => {
    console.log('Extracted startapp parameter:', startAppParam); // Debugging
  }, [startAppParam]);

  useEffect(() => {
    const fetchInvitedFriends = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (isGuest) {
          const mockFriends = Array.from(
            { length: Math.min(user.totalInvites || 0, 3) },
            (_, i) => ({
              id: `mock-${i}`,
              username: `Friend${i + 1}`,
              firstName: `Friend ${i + 1}`,
              points: Math.floor(Math.random() * 10000),
              referralCode: 'MOCK123',
              totalInvites: Math.floor(Math.random() * 10),
              level: Math.floor(Math.random() * 10) + 1,
              balance: 0,
              achievements: 0,
            })
          );
          setInvitedFriends(mockFriends);
        } else {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referredBy', '==', userId));
          const querySnapshot = await getDocs(q);
          const friends = querySnapshot.docs.map((doc) => doc.data() as User);
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

  const handleCopyLink = async () => {
    if (!user?.referralCode) return;

    try {
      const botUsername = 'Tonboxxx_bot'; // Replace with your bot username
      const referralLink = `https://t.me/${botUsername}/Tonb?startapp=${user.referralCode}`;

      if (tg.platform === 'web') {
        await navigator.clipboard.writeText(referralLink);
      } else {
        tg.shareUrl(referralLink);
      }

      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy/share link:', err);
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
      <div className="p-4 max-w-[390px] mx-auto">
        {isGuest && (
          <div className="mb-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl text-sm">
            Running in guest mode - data is stored locally
          </div>
        )}

        <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  Invite Friends
                </h1>
                <p className="text-sm text-gray-400">
                  Share your link and earn rewards together
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
              <div className="text-xs text-gray-400 mb-2">Your Invite Link</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm text-gray-400 truncate">
                  {user?.referralCode
                    ? `t.me/Tonboxxx_bot/ReviveApp?startapp=${user.referralCode}`
                    : 'Loading...'}
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
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Points per invite</span>
                <span className="font-semibold text-purple-400">1,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Your bonus</span>
                <span className="font-semibold text-blue-400">100</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-300">
              <strong>Extracted StartApp Param:</strong>{' '}
              {startAppParam || 'None'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
