import React from 'react';
import { Home, Users, ListTodo, Image, Star } from 'lucide-react';

interface AppBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  disabledTabs?: string[];
}

export const AppBar = ({ activeTab, setActiveTab, disabledTabs = [] }: AppBarProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Early Adopters' },
    { id: 'invites', icon: Users, label: 'Invites' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'nfts', icon: Image, label: 'NFTs' },
    { id: 'airdrop', icon: Star, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-purple-900/80 backdrop-blur-xl border-t border-purple-500/20 shadow-2xl z-50">
      <div className="max-w-[390px] mx-auto">
        <div className="flex justify-around items-center py-2">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isDisabled = disabledTabs.includes(id);
            const isActive = activeTab === id;
            
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setActiveTab(id)}
                disabled={isDisabled}
                className="relative group"
              >
                <div 
                  className={`
                    flex flex-col items-center p-2 rounded-xl transition-all duration-300
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Active tab indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 rounded-xl" />
                  )}

                  {/* Icon and label container */}
                  <div className="relative flex flex-col items-center">
                    <Icon 
                      className={`
                        w-5 h-5 mb-1 transition-all duration-300
                        ${isActive ? 'text-purple-400 scale-110' : 'text-gray-400 group-hover:text-purple-300'}
                      `}
                    />
                    <span 
                      className={`
                        text-[10px] transition-all duration-300
                        ${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-300'}
                      `}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Disabled indicator */}
                  {isDisabled && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};