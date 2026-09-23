"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; // 👈 Integrated sonner toast import

export default function AgentSettingsPage() {
  const [preferences, setPreferences] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const res = await fetch("/api/agent/preferences");
    if (res.ok) {
      const data = await res.json();
      setPreferences(data.preferences);
    }
  };

  const handleSavePreference = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agent/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), value: newValue.trim() }),
      });
      if (res.ok) {
        toast.success("Preference saved successfully!"); // 👈 Sonner success call
        setNewKey("");
        setNewValue("");
        fetchPreferences();
      } else {
        toast.error("Failed to save preference."); // 👈 Error handling fallback
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/memory/clear", { method: "DELETE" });
      if (res.ok) {
        toast.success("Memory cleared completely."); // 👈 Sonner success call
        setPreferences({});
      } else {
        toast.error("Failed to clear memory.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-heading mb-6">Agent Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Current Preferences</Label>
                {Object.keys(preferences).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Koi preferences set nahi hain.</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(preferences).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="font-medium">{key}</span>
                        <span className="text-muted-foreground">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Key (e.g., budgetMin)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
                <Input
                  placeholder="Value (e.g., 5000)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <Button onClick={handleSavePreference} disabled={loading}>
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Clear all conversation memory and preferences. Ye action irreversible hai.
            </p>
            <Button variant="destructive" onClick={handleClearMemory} disabled={loading}>
              Clear All Memory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
