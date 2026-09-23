"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  User,
  Mail,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  LogOut,
  Save,
  Briefcase,
  Search,
  FileText,
  Target,
  Wallet,
  MapPin,
  Tag,
  Clock,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const supabase = getSupabaseBrowserClient();

interface ProfileData {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  trial_starts_at: string;
  trial_ends_at: string;
  created_at: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  subscription_end_date: string | null;
  is_premium: boolean;
  proposals_count: number;
  searches_count: number;
  credits_remaining: number;
  experience_level: string;
  target_client: string[];
  min_budget: number;
  preferred_markets: string[];
  opportunity_types: string[];
  skills: string[];
}

const EXPERIENCE_OPTIONS = ["junior", "mid", "senior"];
const OPPORTUNITY_TYPES = ["freelance", "contract", "full-time", "part-time"];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingName, setUpdatingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Preference form states (inside dialog)
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [minBudget, setMinBudget] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [preferredMarkets, setPreferredMarkets] = useState<string[]>([]);
  const [preferredMarketsInput, setPreferredMarketsInput] = useState("");
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [targetClients, setTargetClients] = useState<string[]>([]);
  const [targetClientInput, setTargetClientInput] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session || !session.user) {
        router.push("/auth/login");
        return;
      }

      const user = session.user;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setEditedName(data.name || "");
        // Initialize form states
        setExperienceLevel(data.experience_level || "mid");
        setMinBudget(data.min_budget || 0);
        setSkills(data.skills || []);
        setPreferredMarkets(data.preferred_markets || []);
        setOpportunityTypes(data.opportunity_types || []);
        setTargetClients(data.target_client || []);
      } else {
        const defaultProfile: ProfileData = {
          id: user.id,
          name: "New User",
          email: user.email || "",
          subscription_plan: "free_trial",
          subscription_status: "active",
          trial_starts_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          paddle_customer_id: null,
          paddle_subscription_id: null,
          subscription_end_date: null,
          is_premium: false,
          proposals_count: 0,
          searches_count: 0,
          credits_remaining: 100,
          experience_level: "mid",
          target_client: [],
          min_budget: 0,
          preferred_markets: [],
          opportunity_types: [],
          skills: [],
        };
        setProfile(defaultProfile);
        setEditedName(defaultProfile.name);
        setExperienceLevel(defaultProfile.experience_level);
        setMinBudget(defaultProfile.min_budget);
        setSkills(defaultProfile.skills);
        setPreferredMarkets(defaultProfile.preferred_markets);
        setOpportunityTypes(defaultProfile.opportunity_types);
        setTargetClients(defaultProfile.target_client);
      }
    } catch (err: any) {
      toast.error("Unable to sync profile credentials with database.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editedName.trim() || editedName === profile.name) return;

    try {
      setUpdatingName(true);
      const { error } = await supabase
        .from("profiles")
        .update({ name: editedName.trim(), updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, name: editedName.trim() } : null));
      toast.success("Profile name updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update name.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!profile) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          experience_level: experienceLevel,
          min_budget: minBudget,
          skills: skills,
          preferred_markets: preferredMarkets,
          opportunity_types: opportunityTypes,
          target_client: targetClients,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              experience_level: experienceLevel,
              min_budget: minBudget,
              skills: skills,
              preferred_markets: preferredMarkets,
              opportunity_types: opportunityTypes,
              target_client: targetClients,
            }
          : null
      );
      toast.success("Preferences updated successfully.");
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Tag helpers
  const addSkill = () => {
    const val = skillsInput.trim();
    if (val && !skills.includes(val)) setSkills([...skills, val]);
    setSkillsInput("");
  };
  const addMarket = () => {
    const val = preferredMarketsInput.trim().toUpperCase();
    if (val && !preferredMarkets.includes(val)) setPreferredMarkets([...preferredMarkets, val]);
    setPreferredMarketsInput("");
  };
  const addTargetClient = () => {
    const val = targetClientInput.trim().toLowerCase();
    if (val && !targetClients.includes(val)) setTargetClients([...targetClients, val]);
    setTargetClientInput("");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center min-h-screen bg-background text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <p className="text-xs font-medium tracking-wide">Verifying Secure Token Identity...</p>
      </div>
    );
  }

  if (!profile) return null;

  const trialDaysLeft = profile.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex-1 bg-transparent min-h-screen text-foreground overflow-y-auto p-4 sm:p-6 md:p-8 antialiased">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold heading-gradient tracking-tight">Account Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your profile, subscription, and preferences.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-xs border-white/10 bg-white/5 hover:bg-white/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>

        {/* Subscription & Usage Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="col-span-2 md:col-span-1 border-white/10 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-bold capitalize">{profile.subscription_plan}</p>
                <p className="text-[10px] text-muted-foreground">Status: {profile.subscription_status}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
              <p className="text-lg font-bold">{profile.credits_remaining}</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (profile.credits_remaining / 100) * 100)}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Proposals</p>
              </div>
              <p className="text-lg font-bold">{profile.proposals_count}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Searches</p>
              </div>
              <p className="text-lg font-bold">{profile.searches_count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Identity + Preferences Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Identity Card */}
          <Card className="lg:col-span-2 border-white/10 bg-card/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Identity Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground/50 select-none cursor-not-allowed">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Registered Name</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 h-9 text-sm bg-white/5 border-white/10 focus:ring-1 ring-primary/40"
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updatingName || !editedName.trim() || editedName === profile.name}
                      className="btn-gradient h-9 px-4 text-xs font-semibold"
                    >
                      {updatingName ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      {updatingName ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preferences Summary Card */}
          <Card className="border-white/10 bg-card/70 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Opportunity Preferences
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="h-7 w-7 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Experience Level</p>
                <Badge variant="secondary" className="capitalize">{profile.experience_level}</Badge>
              </div>
              {profile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                    ))}
                    {profile.skills.length > 5 && <Badge variant="outline" className="text-[10px]">+{profile.skills.length - 5}</Badge>}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Min Budget</p>
                  <p className="text-sm font-medium">${profile.min_budget}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Markets</p>
                  <p className="text-sm font-medium">{profile.preferred_markets.length > 0 ? profile.preferred_markets.join(", ") : "Any"}</p>
                </div>
              </div>
              {profile.opportunity_types.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Opportunity Types</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.opportunity_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px] capitalize">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.target_client.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Clients</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.target_client.map((client) => (
                      <Badge key={client} variant="outline" className="text-[10px]">{client}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trial Info */}
        {profile.subscription_plan === "free_trial" && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">Free Trial</p>
                <p className="text-xs text-muted-foreground">
                  {trialDaysLeft > 0 ? `${trialDaysLeft} days remaining in your trial.` : "Trial period has ended. Please upgrade to continue using premium features."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Preferences Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/10 bg-card/95 backdrop-blur-md text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Opportunity Preferences</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your matching preferences to get better opportunities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Experience Level */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Experience Level</label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="w-full h-9 text-sm bg-white/5 border-white/10">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Budget */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Minimum Budget (USD)</label>
              <Input
                type="number"
                min={0}
                value={minBudget}
                onChange={(e) => setMinBudget(Number(e.target.value))}
                className="w-full h-9 text-sm bg-white/5 border-white/10"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Skills</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] gap-1">
                    {skill}
                    <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Add skill (e.g., React)"
                  className="h-8 text-sm bg-white/5 border-white/10"
                />
                <Button type="button" size="sm" variant="outline" onClick={addSkill} className="h-8 px-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preferred Markets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Preferred Markets</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {preferredMarkets.map((market) => (
                  <Badge key={market} variant="outline" className="text-[10px] gap-1">
                    {market}
                    <button onClick={() => setPreferredMarkets(preferredMarkets.filter((m) => m !== market))} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={preferredMarketsInput}
                  onChange={(e) => setPreferredMarketsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMarket(); } }}
                  placeholder="e.g., US, UK"
                  className="h-8 text-sm bg-white/5 border-white/10"
                />
                <Button type="button" size="sm" variant="outline" onClick={addMarket} className="h-8 px-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Opportunity Types */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Opportunity Types</label>
              <div className="flex flex-wrap gap-2">
                {OPPORTUNITY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setOpportunityTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-colors border",
                      opportunityTypes.includes(type)
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Clients */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Target Clients</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {targetClients.map((client) => (
                  <Badge key={client} variant="outline" className="text-[10px] gap-1">
                    {client}
                    <button onClick={() => setTargetClients(targetClients.filter((c) => c !== client))} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={targetClientInput}
                  onChange={(e) => setTargetClientInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTargetClient(); } }}
                  placeholder="e.g., startup, agency"
                  className="h-8 text-sm bg-white/5 border-white/10"
                />
                <Button type="button" size="sm" variant="outline" onClick={addTargetClient} className="h-8 px-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingPrefs} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSavePreferences} disabled={savingPrefs} className="btn-gradient text-xs">
              {savingPrefs ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {savingPrefs ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}