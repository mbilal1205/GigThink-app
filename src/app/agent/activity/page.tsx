"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  _id: string;
  actionType: string;
  description: string;
  createdAt: string;
}

export default function AgentActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/activity");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearActivities = async () => {
    await fetch("/api/agent/activity", {
      method: "DELETE",
    });
    fetchActivities();
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-heading">Agent Activity Log</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearActivities}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <p>Koi activity nahi mili.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity._id} className="p-4 flex items-start gap-3">
              <Badge variant={activity.actionType === "proactive_alert" ? "default" : "secondary"}>
                {activity.actionType}
              </Badge>
              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}