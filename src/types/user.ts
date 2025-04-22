export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  points: number;
  referralCode: string;
  referralLink: string;
  referredBy?: string;
  totalInvites: number;
  dailyRank?: number;
  globalRank?: number;
  level: number;
  balance: number;
  achievements: number;
  unlockedAchievements?: string[];
  unlockedTiers?: number[];
  walletAddress: string | null;
  isEarlyAdopter?: boolean;
  earlyAdopterClaimedAt?: Date;
}

export interface ReferralTier {
  invites: number;
  reward: number;
  title: string;
}