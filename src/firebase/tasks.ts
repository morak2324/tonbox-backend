import { db } from '../Firebase';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { unlockAchievement, Achievement } from './achievements';

interface CheckInData {
  lastCheckIn: Timestamp;
  streak: number;
}

interface TaskProgress {
  inviteTask: boolean;
  profileTask: boolean;
}

export const checkInUser = async (userId: string): Promise<{ success: boolean; message: string; streak: number }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const checkInRef = doc(db, 'checkIns', userId);

    // Get current server timestamp
    const now = Timestamp.now();
    const today = new Date(now.toDate().setHours(0, 0, 0, 0));

    // Get user's last check-in data
    const checkInDoc = await getDoc(checkInRef);
    const checkInData = checkInDoc.data() as CheckInData | undefined;

    if (checkInData) {
      const lastCheckIn = checkInData.lastCheckIn.toDate();
      const lastCheckInDay = new Date(lastCheckIn.setHours(0, 0, 0, 0));

      // Check if already checked in today
      if (today.getTime() === lastCheckInDay.getTime()) {
        return {
          success: false,
          message: 'Already checked in today',
          streak: checkInData.streak
        };
      }

      // Check if streak should continue or reset
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutiveDay = lastCheckInDay.getTime() === yesterday.getTime();
      const newStreak = isConsecutiveDay ? checkInData.streak + 1 : 1;

      // Update check-in data
      await setDoc(checkInRef, {
        lastCheckIn: now,
        streak: newStreak
      });

      // Update user points
      await updateDoc(userRef, {
        points: increment(20)
      });

      return {
        success: true,
        message: 'Check-in successful',
        streak: newStreak
      };
    } else {
      // First time check-in
      await setDoc(checkInRef, {
        lastCheckIn: now,
        streak: 1
      });

      // Update user points
      await updateDoc(userRef, {
        points: increment(20)
      });

      return {
        success: true,
        message: 'First check-in successful',
        streak: 1
      };
    }
  } catch (error) {
    console.error('Check-in error:', error);
    return {
      success: false,
      message: 'Failed to check in',
      streak: 0
    };
  }
};

export const completeInviteTask = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const taskRef = doc(db, 'tasks', userId);
    
    // Get user data to check referral count
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (!userData) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user has 20 or more referrals
    if (userData.totalInvites < 20) {
      return {
        success: false,
        message: `Invite ${20 - userData.totalInvites} more friends to complete this task`
      };
    }

    // Check if task was already completed
    const taskDoc = await getDoc(taskRef);
    const taskData = taskDoc.data() as TaskProgress;

    if (taskData?.inviteTask) {
      return {
        success: false,
        message: 'Task already completed'
      };
    }

    // Update task progress
    await setDoc(taskRef, {
      ...taskData,
      inviteTask: true
    }, { merge: true });

    // Award points and unlock achievement
    await updateDoc(userRef, {
      points: increment(3000)
    });

    // Unlock Super Referrer achievement
    await unlockAchievement(userId, Achievement.SUPER_REFERRER);

    return {
      success: true,
      message: 'Congratulations! You earned 3000 points!'
    };
  } catch (error) {
    console.error('Complete invite task error:', error);
    return {
      success: false,
      message: 'Failed to complete task'
    };
  }
};

export const completeEarlyAdopter = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (!userData) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if already an early adopter
    if (userData.isEarlyAdopter) {
      return {
        success: false,
        message: 'Already claimed early adopter reward'
      };
    }

    // Check requirements
    if (userData.totalInvites < 7) {
      return {
        success: false,
        message: `Invite ${7 - userData.totalInvites} more friends to qualify`
      };
    }

    // Update user data and unlock achievement
    await updateDoc(userRef, {
      points: increment(10000),
      isEarlyAdopter: true,
      earlyAdopterClaimedAt: Timestamp.now()
    });

    // Unlock Early Adopter achievement
    await unlockAchievement(userId, Achievement.EARLY_ADOPTER);

    return {
      success: true,
      message: 'Congratulations! You earned 10,000 Tonbox!'
    };
  } catch (error) {
    console.error('Complete early adopter error:', error);
    return {
      success: false,
      message: 'Failed to complete task'
    };
  }
};