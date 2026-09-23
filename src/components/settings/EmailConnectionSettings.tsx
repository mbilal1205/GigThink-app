"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ConnectionData {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass?: string; // only for input, not returned from GET
  from_name: string;
  from_email: string;
}

export function EmailConnectionSettings() {
  const [form, setForm] = useState<ConnectionData>({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    from_name: "",
    from_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const fetchConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/connection");
      const data = await res.json();
      if (res.ok && data.connection) {
        setForm({
          smtp_host: data.connection.smtp_host,
          smtp_port: data.connection.smtp_port,
          smtp_user: data.connection.smtp_user,
          smtp_pass: "", // blank for security
          from_name: data.connection.from_name,
          from_email: data.connection.from_email,
        });
        setConnected(true);
        setConnectionId(data.connection.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const handleSave = async () => {
    if (!form.smtp_host || !form.smtp_user || !form.smtp_pass || !form.from_name || !form.from_email) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/email/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save connection");
      toast.success("Email connection saved!");
      setConnected(true);
      setConnectionId(data.connection.id);
      setForm({ ...form, smtp_pass: "" }); // clear password after save
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Remove email connection?")) return;
    try {
      const res = await fetch(`/api/email/connection`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect");
      toast.success("Email disconnected");
      setConnected(false);
      setForm({ smtp_host: "", smtp_port: 587, smtp_user: "", smtp_pass: "", from_name: "", from_email: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Card className="border-white/10 bg-card/70">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-5 w-5 text-primary" /> Email Connection
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Connect your own email (Gmail, Outlook, etc.) to send pitches directly from your address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Connected as {form.from_email}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">SMTP Host *</Label>
            <Input
              value={form.smtp_host}
              onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SMTP Port *</Label>
            <Input
              type="number"
              value={form.smtp_port}
              onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SMTP Username *</Label>
            <Input
              value={form.smtp_user}
              onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
              placeholder="your-email@gmail.com"
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SMTP Password (App Password) *</Label>
            <Input
              type="password"
              value={form.smtp_pass}
              onChange={(e) => setForm({ ...form, smtp_pass: e.target.value })}
              placeholder="Enter password (won't be shown)"
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From Name *</Label>
            <Input
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              placeholder="Your Agency Name"
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From Email *</Label>
            <Input
              value={form.from_email}
              onChange={(e) => setForm({ ...form, from_email: e.target.value })}
              placeholder="your-email@gmail.com"
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
        </div>

        {!connected ? (
          <Button className="btn-gradient gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {saving ? "Saving..." : "Connect Email"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button className="btn-gradient gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {saving ? "Updating..." : "Update Connection"}
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          * For Gmail, use an App Password (enable 2FA). For other providers, use their SMTP settings.
        </p>
      </CardContent>
    </Card>
  );
}