"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { APP_CONNECTORS } from "@/lib/connectors";

interface Connection {
  id: string;
  provider: string;
  email: string;
  created_at: string;
}

export default function AppConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connector: (typeof APP_CONNECTORS)[number]) => {
    setConnecting(connector.provider);
    try {
      // Agar connector ka apna direct URL hai to wahan redirect karo
      if (connector.connectUrl) {
        window.location.href = connector.connectUrl;
        return;
      }

      // Generic connect API call
      const res = await fetch("/api/connections/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: connector.provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success("Connected");
        fetchConnections();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this app?")) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Disconnected successfully");
        fetchConnections();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to disconnect");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold heading-gradient">App Connections</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your favourite apps to enhance GigThink automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {APP_CONNECTORS.map((connector) => {
          const connected = connections.find((c) => c.provider === connector.provider);
          const Icon = connector.icon;
          return (
            <Card key={connector.provider} className="border-white/10 bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {connector.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">{connector.description}</p>
                {connected ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Connected
                      </Badge>
                      <p className="text-xs mt-1">{connected.email || "Connected account"}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connected.id)}
                      className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(connector)}
                    disabled={connecting === connector.provider}
                    className="btn-gradient text-xs"
                  >
                    {connecting === connector.provider ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}