import React from 'react';
import { Home, Users, ListTodo, Image, Star } from 'lucide-react';

interface AppBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  disabledTabs?: string[];
}

export const AppBar = ({ activeTab, setActiveTab, disabledTabs = [] }: AppBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-purple-900/80 backdrop-blur-xl border-t border-purple-500/20 shadow-2xl z-50">
      <div className="max-w-[390px] mx-auto">
        <div className="flex justify-around items-center py-2">
          {[
            { id: 'home', icon: Home, label: 'Early Adopters' },
            { id: 'invites', icon: Users, label: 'Invites' },
            { id: 'tasks', icon: ListTodo, label: 'Tasks' },
            { id: 'nfts', icon: Image, label: 'NFTs' },
            { id: 'airdrop', icon: Star, label: 'Airdrop' },
          ].map(({ id, icon: Icon, label }) => {
            const isDisabled = disabledTabs.includes(id);
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setActiveTab(id)}
                disabled={isDisabled}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed'
                    : activeTab === id
                    ? 'text-purple-400 bg-white/10'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px]">{label}</span>
                {isDisabled && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};