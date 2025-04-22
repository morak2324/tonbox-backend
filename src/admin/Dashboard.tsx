import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../Firebase';
import { Users, Star, Trophy, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPoints: 0,
    earlyAdopters: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const earlyAdoptersQuery = query(usersRef, where('isEarlyAdopter', '==', true));
        const earlyAdoptersSnapshot = await getDocs(earlyAdoptersQuery);

        let totalPoints = 0;
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          totalPoints += userData.points || 0;
        });

        setStats({
          totalUsers: usersSnapshot.size,
          activeUsers: usersSnapshot.size, // You can modify this based on your activity criteria
          totalPoints,
          earlyAdopters: earlyAdoptersSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 via-blue-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 via-yellow-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-yellow-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Points</p>
              <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 via-green-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-green-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Early Adopters</p>
              <p className="text-2xl font-bold">{stats.earlyAdopters}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}