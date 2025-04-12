"use client";

import { useEffect, useState } from "react";
import { Card, Metric, Text } from "@tremor/react";
import { Users, Trophy, Star, Activity } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function StatsGrid() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    earlyAdopters: 0,
    totalPoints: 0,
    activeToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, "users");
        const [usersSnapshot, earlyAdoptersSnapshot] = await Promise.all([
          getDocs(usersRef),
          getDocs(query(usersRef, where("isEarlyAdopter", "==", true))),
        ]);

        let totalPoints = 0;
        usersSnapshot.forEach((doc) => {
          totalPoints += doc.data().points || 0;
        });

        setStats({
          totalUsers: usersSnapshot.size,
          earlyAdopters: earlyAdoptersSnapshot.size,
          totalPoints,
          activeToday: Math.floor(Math.random() * usersSnapshot.size), // Mock data
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const items = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "blue",
    },
    {
      title: "Early Adopters",
      value: stats.earlyAdopters.toLocaleString(),
      icon: Trophy,
      color: "amber",
    },
    {
      title: "Total Points",
      value: stats.totalPoints.toLocaleString(),
      icon: Star,
      color: "purple",
    },
    {
      title: "Active Today",
      value: stats.activeToday.toLocaleString(),
      icon: Activity,
      color: "green",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-lg bg-${item.color}-100`}
            >
              <item.icon
                className={`w-6 h-6 text-${item.color}-500`}
              />
            </div>
            <div>
              <Text>{item.title}</Text>
              <Metric>{item.value}</Metric>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}