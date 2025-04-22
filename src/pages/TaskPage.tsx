import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ClipboardCheck,
  ArrowRight,
  Calendar,
  X,
  Star,
  Gift,
  ListTodo,
  Shuffle,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { checkInUser, completeInviteTask } from '../firebase/tasks';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import Confetti from 'react-confetti';
import Lottie from 'lottie-react';
import starAnimation from '../assets/animations/star.json';

// Verification puzzle types
type PuzzleType = {
  question: string;
  options: string[];
  answer: string;
};

const puzzles: PuzzleType[] = [
  {
    question: "What comes next? 2, 4, 6, 8, ...",
    options: ["9", "10", "12", "14"],
    answer: "10"
  },
  {
    question: "Complete the pattern: 🔵 🔴 🔵 🔴 ...",
    options: ["🔵", "🔴", "⚫", "⚪"],
    answer: "🔵"
  },
  {
    question: "What letter comes next? A, C, E, G, ...",
    options: ["H", "I", "J", "K"],
    answer: "I"
  }
];

export function TaskPage() {
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showClaimed, setShowClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleType | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [inviteTaskCompleted, setInviteTaskCompleted] = useState(false);

  const tg = window.Telegram.WebApp;
  const userId = tg.initDataUnsafe?.user?.id?.toString();
  const { user, loading: userLoading, isGuest, updateGuestUser } = useUser(userId);

  // Check if invite task is completed
  useEffect(() => {
    if (user?.totalInvites && user.totalInvites >= 20) {
      setInviteTaskCompleted(true);
    }
  }, [user?.totalInvites]);

  // Load claimed days
  useEffect(() => {
    if (isGuest) {
      const saved = localStorage.getItem('claimedDays');
      if (saved) {
        setClaimedDays(JSON.parse(saved));
      }
    } else if (userId) {
      const loadClaimedDays = async () => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        if (userData?.claimedDays) {
          setClaimedDays(userData.claimedDays);
        }
      };
      loadClaimedDays();
    }
  }, [isGuest, userId]);

  // Check if user has already checked in today
  useEffect(() => {
    const checkLastCheckIn = async () => {
      if (!userId && !isGuest) return;

      try {
        if (isGuest) {
          const lastCheckIn = localStorage.getItem('lastCheckIn');
          if (lastCheckIn) {
            const lastCheckInDate = new Date(parseInt(lastCheckIn));
            const today = new Date();
            if (lastCheckInDate.toDateString() === today.toDateString()) {
              setCheckedIn(true);
              return;
            }
          }
        } else {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          if (userData?.lastCheckIn) {
            const lastCheckIn = userData.lastCheckIn.toDate();
            const today = new Date();
            if (lastCheckIn.toDateString() === today.toDateString()) {
              setCheckedIn(true);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking last check-in:', error);
      }
    };

    checkLastCheckIn();
  }, [userId, isGuest]);

  // Load streak from storage
  useEffect(() => {
    const loadStreak = async () => {
      if (isGuest) {
        const savedStreak = localStorage.getItem('streak');
        if (savedStreak) {
          setStreak(parseInt(savedStreak));
        }
      } else if (userId) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        if (userData?.streak) {
          setStreak(userData.streak);
        }
      }
    };

    loadStreak();
  }, [isGuest, userId]);

  const activeTasks = [
    { 
      id: 2, 
      title: 'Daily Check-in', 
      description: 'Log in daily to earn 20 points.', 
      completed: checkedIn,
      icon: Calendar
    },
    !inviteTaskCompleted && { 
      id: 3, 
      title: 'Invite Friends', 
      description: `Invite 20 friends to earn 3000 points. Progress: ${user?.totalInvites || 0}/20`, 
      completed: false,
      progress: user?.totalInvites ? (user.totalInvites / 20) * 100 : 0,
      icon: Gift
    },
  ].filter(Boolean);

  const completedTasks = [
    { 
      id: 1, 
      title: 'Complete Profile Setup', 
      description: 'Earned 50 points by completing your profile.', 
      completed: true,
      icon: CheckCircle
    },
    inviteTaskCompleted && { 
      id: 3, 
      title: 'Invite Friends', 
      description: 'Earned 3000 points by inviting 20 friends.', 
      completed: true,
      icon: Gift
    },
  ].filter(Boolean);

  const generateNewPuzzle = () => {
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    setCurrentPuzzle(puzzles[randomIndex]);
    setWrongAnswer(false);
  };

  const handlePuzzleAnswer = (answer: string) => {
    if (!currentPuzzle) return;

    if (answer === currentPuzzle.answer) {
      setVerificationComplete(true);
      setShowPuzzle(false);
      handleCheckin();
    } else {
      setWrongAnswer(true);
      setTimeout(() => setWrongAnswer(false), 1000);
    }
  };

  const handleCheckin = async () => {
    if (!userId && !isGuest) {
      setError('User not found');
      return;
    }

    try {
      setCheckingIn(true);
      setError(null);

      const today = new Date();
      const dayOfWeek = today.getDay();

      if (isGuest) {
        const lastCheckIn = localStorage.getItem('lastCheckIn');
        const todayStart = new Date().setHours(0, 0, 0, 0);
        
        if (lastCheckIn && new Date(parseInt(lastCheckIn)).setHours(0, 0, 0, 0) === todayStart) {
          setError('Already checked in today');
          return;
        }

        localStorage.setItem('lastCheckIn', Date.now().toString());
        const currentStreak = parseInt(localStorage.getItem('streak') || '0');
        const newStreak = currentStreak + 1;
        localStorage.setItem('streak', newStreak.toString());
        
        // Update claimed days
        const newClaimedDays = [...claimedDays, dayOfWeek];
        if (newClaimedDays.length === 7) {
          setClaimedDays([dayOfWeek]);
          localStorage.setItem('claimedDays', JSON.stringify([dayOfWeek]));
        } else {
          setClaimedDays(newClaimedDays);
          localStorage.setItem('claimedDays', JSON.stringify(newClaimedDays));
        }
        
        updateGuestUser({
          points: (user?.points || 0) + 20
        });
        
        setCheckedIn(true);
        setStreak(newStreak);
      } else {
        const result = await checkInUser(userId!);
        
        if (!result.success) {
          setError(result.message);
          return;
        }
        
        // Update claimed days in database
        const userRef = doc(db, 'users', userId);
        const newClaimedDays = [...claimedDays, dayOfWeek];
        if (newClaimedDays.length === 7) {
          await updateDoc(userRef, { claimedDays: [dayOfWeek] });
          setClaimedDays([dayOfWeek]);
        } else {
          await updateDoc(userRef, { claimedDays: newClaimedDays });
          setClaimedDays(newClaimedDays);
        }
        
        setStreak(result.streak);
        setCheckedIn(true);
      }

      setShowCheckin(false);
      setShowConfetti(true);
      setShowClaimed(true);
      
      setTimeout(() => {
        setShowConfetti(false);
        setShowClaimed(false);
      }, 3000);
    } catch (err) {
      setError('Failed to check in');
      console.error('Check-in error:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStartCheckin = () => {
    if (checkedIn) {
      setError('Already checked in today');
      return;
    }
    generateNewPuzzle();
    setShowPuzzle(true);
  };

  const handleInviteTask = async () => {
    if (isGuest) {
      setError('This feature is not available in guest mode');
      return;
    }

    if (!userId) {
      setError('User not found');
      return;
    }

    try {
      const result = await completeInviteTask(userId);
      
      if (!result.success) {
        setError(result.message);
        return;
      }

      setInviteTaskCompleted(true);
      setTaskMessage(result.message);
      setTimeout(() => {
        setTaskMessage(null);
      }, 3000);
    } catch (err) {
      setError('Failed to complete task');
      console.error('Complete invite task error:', err);
    }
  };

  if (userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0F] text-white overflow-y-auto pb-24">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      {/* Header */}
      <div className="p-4 max-w-[390px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-500/10 mb-6"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <ListTodo className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  Daily Tasks
                </h1>
                <p className="text-sm text-gray-400">
                  Complete tasks to earn rewards
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Check-in Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-500/10 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Daily Check-in</h2>
                <p className="text-sm text-gray-400">Day {streak} streak</p>
              </div>
            </div>
            {checkedIn && (
              <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                Claimed
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl flex items-center justify-center relative ${
                  claimedDays.includes(index)
                    ? 'bg-yellow-500'
                    : 'bg-white/5'
                }`}
              >
                <Star
                  className={`w-6 h-6 ${
                    claimedDays.includes(index) ? 'text-white' : 'text-gray-600'
                  }`}
                />
                {claimedDays.includes(index) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleStartCheckin}
            disabled={checkedIn}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              checkedIn
                ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {checkedIn ? (
              <>
                <Check className="w-5 h-5" />
                Come back tomorrow!
              </>
            ) : (
              <>
                Check In Now
                <Gift className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Active Tasks</h2>
            <div className="space-y-4">
              {activeTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <task.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-400">{task.description}</p>
                      {task.progress !== undefined && (
                        <div className="mt-2 bg-white/5 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className="h-full bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {!task.completed && task.id === 3 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInviteTask}
                      className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      Claim Reward
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
            <div className="space-y-4">
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-green-500/20 opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-xl">
                      <task.icon className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-400">{task.description}</p>
                    </div>
                    <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Claimed
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-xl shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Success Message */}
      <AnimatePresence>
        {taskMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-4 py-2 rounded-xl shadow-lg"
          >
            {taskMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Puzzle */}
      <AnimatePresence>
        {showPuzzle && currentPuzzle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0A0F] rounded-3xl p-6 max-w-md w-full mx-auto border border-purple-500/10"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shuffle className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Quick Verification</h3>
                <p className="text-gray-400">{currentPuzzle.question}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentPuzzle.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePuzzleAnswer(option)}
                    className={`p-6 rounded-xl text-center text-lg transition-all ${
                      wrongAnswer
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>

              {wrongAnswer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center text-red-400 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Wrong answer, try again!
                </motion.div>
              )}

              <button
                onClick={generateNewPuzzle}
                className="mt-4 w-full p-4 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-500/30 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Try Different Question
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showClaimed && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 text-center shadow-2xl max-w-md w-full">
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <Lottie
                  animationData={starAnimation}
                  loop={true}
                  className="w-full h-full opacity-30"
                />
              </div>
              <div className="relative">
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  className="mb-4"
                >
                  <Gift className="w-16 h-16 text-yellow-400 mx-auto" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">+20 Points Claimed!</h3>
                <p className="text-lg text-purple-200">
                  {streak > 1 ? `${streak} Day Streak! 🔥` : 'Keep the streak going!'}
                </p>
                <div className="mt-6 text-sm text-purple-200">
                  Come back tomorrow for more rewards!
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}