"use client";

import { useEffect, useState } from "react";
import { Card, Title, DonutChart } from "@tremor/react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function UsersOverview() {
  const [data, setData] = useState([
    { name: "Regular Users", value: 0 },
    { name: "Early Adopters", value: 0 },
    { name: "Inactive", value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        
        let regular = 0;
        let earlyAdopters = 0;
        let inactive = 0;

        snapshot.forEach((doc) => {
          const user = doc.data();
          if (user.isEarlyAdopter) {
            earlyAdopters++;
          } else if (user.lastActive) {
            const lastActive = new Date(user.lastActive.seconds * 1000);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            if (lastActive < thirtyDaysAgo) {
              inactive++;
            } else {
              regular++;
            }
          } else {
            regular++;
          }
        });

        setData([
          { name: "Regular Users", value: regular },
          { name: "Early Adopters", value: earlyAdopters },
          { name: "Inactive", value: inactive },
        ]);
      } catch (error) {
        console.error("Error fetching user overview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="h-[350px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Users Overview</Title>
      <DonutChart
        className="mt-6"
        data={data}
        category="value"
        index="name"
        colors={["blue", "amber", "gray"]}
      />
    </Card>
  );
}