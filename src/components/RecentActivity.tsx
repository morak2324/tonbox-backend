"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Title,
} from "@tremor/react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  userId: string;
  username: string;
  timestamp: any;
  details: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activitiesRef = collection(db, "activities");
    const q = query(activitiesRef, orderBy("timestamp", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      setActivities(newActivities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "login":
        return <Badge color="blue">Login</Badge>;
      case "points":
        return <Badge color="green">Points</Badge>;
      case "invite":
        return <Badge color="purple">Invite</Badge>;
      default:
        return <Badge color="gray">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Recent Activity</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Activity</TableHeaderCell>
            <TableHeaderCell>Details</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>{activity.username}</TableCell>
              <TableCell>{getActivityBadge(activity.type)}</TableCell>
              <TableCell>{activity.details}</TableCell>
              <TableCell>
                {formatDistanceToNow(activity.timestamp.toDate(), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}