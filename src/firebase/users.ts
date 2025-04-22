import { db } from '../Firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  increment, 
  orderBy, 
  limit,
  Timestamp,
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import type { User, ReferralTier } from '../types/user';

// Notcoin-style referral tiers
const REFERRAL_TIERS: ReferralTier[] = [
  { invites: 1, reward: 1000, title: 'Bronze' },
  { invites: 3, reward: 2000, title: 'Silver' },
  { invites: 7, reward: 5000, title: 'Gold' },
  { invites: 15, reward: 10000, title: 'Platinum' },
  { invites: 25, reward: 20000, title: 'Diamond' },
  { invites: 50, reward: 50000, title: 'Master' },
];

const POINTS_PER_REFERRAL = 150;

// Helper function to generate referral link
const generateReferralLink = (code: string): string => {
  const botUsername = 'Tonboxxx_bot';
  return `https://t.me/${botUsername}?start=${code}`;
};

// Helper function to generate random referral code
const generateReferralCode = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper to validate referral code format
const isValidReferralCode = (code: string): boolean => {
  return /^[A-Z0-9]{8}$/.test(code);
};

export const createUser = async (userId: string, userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
  try {
    if (userData.walletAddress) {
      const walletsRef = collection(db, 'users');
      const walletQuery = query(walletsRef, where('walletAddress', '==', userData.walletAddress));
      const walletSnapshot = await getDocs(walletQuery);

      if (!walletSnapshot.empty) {
        return {
          success: false,
          error: 'This wallet is already associated with another account'
        };
      }
    }

    const userRef = doc(db, 'users', userId);
    const referralCode = generateReferralCode(8);
    const referralLink = generateReferralLink(referralCode);
    
    const defaultUser: User = {
      id: userId,
      points: 0,
      referralCode,
      referralLink,
      totalInvites: 0,
      level: 1,
      balance: 0,
      achievements: 0,
      walletAddress: userData.walletAddress || null,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      username: userData.username || '',
      photoUrl: userData.photoUrl,
      referralHistory: [],
      referredBy: null,
      referralRewards: 0,
      lastReferralAt: null,
      referralTier: 0,
      unlockedTiers: [],
      unclaimedReferralRewards: [],
      createdAt: Timestamp.now(),
      ...userData
    };

    await setDoc(userRef, defaultUser);
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: 'Failed to create user account'
    };
  }
};

export const applyReferralCode = async (userId: string, referralCode: string): Promise<boolean> => {
  try {
    if (!userId || !referralCode) {
      console.error('Invalid input: userId and referralCode are required');
      return false;
    }

    if (!isValidReferralCode(referralCode)) {
      console.error('Invalid referral code format');
      return false;
    }

    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        console.error('User not found');
        return false;
      }

      const userData = userDoc.data() as User;

      if (userData.referredBy) {
        console.error('User already has a referrer');
        return false;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('Invalid referral code - no matching user found');
        return false;
      }

      const referrer = querySnapshot.docs[0];
      const referrerId = referrer.id;
      const referrerData = referrer.data() as User;

      if (referrerId === userId) {
        console.error('Cannot refer yourself');
        return false;
      }

      // Calculate new tier and rewards
      const currentInvites = referrerData.totalInvites + 1;
      const newTier = REFERRAL_TIERS.findIndex(tier => currentInvites === tier.invites);
      const tierReward = newTier >= 0 ? REFERRAL_TIERS[newTier].reward : 0;

      // Create referral record with timestamp
      const timestamp = Timestamp.now();
      const referralRecord = {
        userId,
        referrerId,
        timestamp,
        points: POINTS_PER_REFERRAL,
        tier: newTier + 1
      };

      // Update referred user
      transaction.update(userRef, {
        referredBy: referrerId,
        points: increment(POINTS_PER_REFERRAL),
        referralHistory: arrayUnion(referralRecord),
        updatedAt: timestamp
      });

      // Update referrer
      const referrerRef = doc(db, 'users', referrerId);
      const referrerUpdates: any = {
        totalInvites: increment(1),
        points: increment(POINTS_PER_REFERRAL),
        lastReferralAt: timestamp,
        referralHistory: arrayUnion(referralRecord),
        updatedAt: timestamp
      };

      // Add tier reward if reached new tier
      if (tierReward > 0 && !referrerData.unlockedTiers?.includes(newTier)) {
        referrerUpdates.points = increment(tierReward + POINTS_PER_REFERRAL);
        referrerUpdates.referralTier = newTier + 1;
        referrerUpdates.unlockedTiers = [...(referrerData.unlockedTiers || []), newTier];
      }

      transaction.update(referrerRef, referrerUpdates);

      // Create referral analytics record
      const referralsRef = doc(collection(db, 'referrals'));
      transaction.set(referralsRef, {
        ...referralRecord,
        referrerUsername: referrerData.username,
        referredUsername: userData.username,
        tierReached: newTier >= 0 ? newTier + 1 : 0,
        createdAt: timestamp
      });

      return true;
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    return false;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getTopUsers = async (limit: number = 50): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('points', 'desc'), limit(limit));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
};