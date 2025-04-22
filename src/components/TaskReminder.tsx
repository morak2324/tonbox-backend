import React from 'react';
import { X, Gift, Users, Wallet } from 'lucide-react';
import type { User } from '../types/user';

interface TaskReminderProps {
  user: User | null;
  analyzed: boolean;
  onClose: () => void;
  onAction: (action: 'invite' | 'analyze') => void;
}

export function TaskReminder({ user, analyzed, onClose, onAction }: TaskReminderProps) {
  const invitesNeeded = 7 - (user?.totalInvites || 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0F] rounded-3xl max-w-md w-full border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent" />
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-xl transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                Complete Tasks
              </h2>
              <p className="text-gray-400">Earn rewards in the early adopters program</p>
            </div>
          </div>

          <div className="space-y-4">
            {!analyzed && (
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold">Analyze Your Wallet</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Analyze your wallet to unlock features and earn points
                </p>
                <button
                  onClick={() => onAction('analyze')}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Analyze Now
                </button>
              </div>
            )}

            {invitesNeeded > 0 && (
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">Invite Friends</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Invite {invitesNeeded} more friend{invitesNeeded > 1 ? 's' : ''} to complete the early adopters program
                </p>
                <button
                  onClick={() => onAction('invite')}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Invite Friends
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-500">
              Complete these tasks to maximize your rewards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TaskReminder }