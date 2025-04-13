import { Card, Title, BarChart, Subtitle } from "@tremor/react";
import { UsersOverview } from "@/components/UsersOverview";
import { RecentActivity } from "@/components/RecentActivity";
import { StatsGrid } from "@/components/StatsGrid";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to the Tonbox admin panel</p>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <Title>New Users (Last 30 Days)</Title>
          <Subtitle>Daily user registrations</Subtitle>
          <BarChart
            className="mt-6"
            data={[]}
            index="date"
            categories={["users"]}
            colors={["blue"]}
            yAxisWidth={48}
          />
        </Card>

        <UsersOverview />
      </div>

      <RecentActivity />
    </div>
  );
}
