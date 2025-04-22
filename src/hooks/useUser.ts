import { useState, useEffect, useCallback } from 'react';
import { getUser, createUser } from '../firebase/users';
import type { User } from '../types/user';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Improved guest user data persistence
const getGuestUser = (): User => {
  const storedUser = localStorage.getItem('guestUser');
  if (storedUser) {
    return JSON.parse(storedUser);
  }

  const guestUser: User = {
    id: 'guest-' + Math.random().toString(36).substr(2, 9),
    points: 0,
    referralCode: 'GUEST' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    totalInvites: 0,
    level: 1,
    balance: 0,
    achievements: 0,
    firstName: 'Guest',
    username: 'guest_user',
    walletAddress: null
  };

  localStorage.setItem('guestUser', JSON.stringify(guestUser));
  return guestUser;
};

export const useUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get Telegram user data
  const tg = window.Telegram.WebApp;
  const telegramUser = tg.initDataUnsafe?.user;

  // Memoize updateGuestUser function
  const updateGuestUser = useCallback((updates: Partial<User>) => {
    if (isLocalhost && user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('guestUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Use guest mode on localhost
        if (isLocalhost) {
          const guestUser = getGuestUser();
          setUser(guestUser);
          setLoading(false);
          return;
        }

        // Regular user flow for production
        if (!userId) {
          setLoading(false);
          return;
        }

        let userData = await getUser(userId);
        
        if (!userData) {
          // Create new user with Telegram data
          const result = await createUser(userId, {
            firstName: telegramUser?.first_name || '',
            lastName: telegramUser?.last_name || '',
            username: telegramUser?.username || '',
            photoUrl: telegramUser?.photo_url
          });

          if (!result.success) {
            throw new Error(result.error);
          }
          userData = await getUser(userId);
        } else {
          // Update existing user's Telegram data if it changed
          const needsUpdate = 
            userData.firstName !== telegramUser?.first_name ||
            userData.lastName !== telegramUser?.last_name ||
            userData.username !== telegramUser?.username ||
            userData.photoUrl !== telegramUser?.photo_url;

          if (needsUpdate) {
            await updateUser(userId, {
              firstName: telegramUser?.first_name,
              lastName: telegramUser?.last_name,
              username: telegramUser?.username,
              photoUrl: telegramUser?.photo_url
            });
            userData = await getUser(userId);
          }
        }

        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, telegramUser]);

  return { 
    user, 
    loading, 
    error,
    isGuest: isLocalhost,
    updateGuestUser 
  };
};