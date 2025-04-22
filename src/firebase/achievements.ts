import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';

export enum Achievement {
  EARLY_ADOPTER = 'early_adopter',
  NFT_COLLECTOR = 'nft_collector',
  SUPER_REFERRER = 'super_referrer'
}

interface AchievementData {
  id: Achievement;
  title: string;
  description: string;
  points: number;
}

export const ACHIEVEMENTS: Record<Achievement, AchievementData> = {
  [Achievement.EARLY_ADOPTER]: {
    id: Achievement.EARLY_ADOPTER,
    title: 'Early Adopter',
    description: 'Completed the early adopters program',
    points: 1
  },
  [Achievement.NFT_COLLECTOR]: {
    id: Achievement.NFT_COLLECTOR,
    title: 'NFT Collector',
    description: 'Purchased an NFT from our collection',
    points: 1
  },
  [Achievement.SUPER_REFERRER]: {
    id: Achievement.SUPER_REFERRER,
    title: 'Super Referrer',
    description: 'Referred over 20 friends',
    points: 1
  }
};

export async function unlockAchievement(userId: string, achievementId: Achievement): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found');
      return false;
    }

    const userData = userDoc.data();
    const unlockedAchievements = userData.unlockedAchievements || [];

    // Check if achievement is already unlocked
    if (unlockedAchievements.includes(achievementId)) {
      return false;
    }

    // Update user document with new achievement
    await updateDoc(userRef, {
      unlockedAchievements: [...unlockedAchievements, achievementId],
      achievements: increment(1)
    });

    return true;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
}

export async function getUnlockedAchievements(userId: string): Promise<Achievement[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    return userData.unlockedAchievements || [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}