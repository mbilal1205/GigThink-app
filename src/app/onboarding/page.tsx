"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  Wallet,
  MapPin,
  Tag,
  Target,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  User,
  Building2,
  Palette,
  Globe,
  DollarSign,
  Type,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Constants
const EXPERIENCE_OPTIONS = ["junior", "mid", "senior"];
const OPPORTUNITY_TYPES = ["freelance", "contract", "full-time", "part-time"];
const FONT_OPTIONS = ["Inter", "Roboto", "Poppins", "Playfair Display", "Space Grotesk"];
const BRAND_TONES = [
  "Professional and Direct",
  "Modern & Casual",
  "Authoritative & Technical",
  "Persuasive & Sales-Focused",
];
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED"];
const TIMEZONES = ["Asia/Karachi", "America/New_York", "Europe/London", "Asia/Dubai"];

export default function OnboardingPage() {
  const router = useRouter();

  // Step & Loading
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // User Type
  const [userType, setUserType] = useState<"individual" | "agency" | null>(null);

  // Preferences State (same as before)
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [minBudget, setMinBudget] = useState(0);
  const [preferredMarkets, setPreferredMarkets] = useState<string[]>([]);
  const [preferredMarketsInput, setPreferredMarketsInput] = useState("");
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [targetClients, setTargetClients] = useState<string[]>([]);
  const [targetClientInput, setTargetClientInput] = useState("");

  // Agency Details State
  const [agencyData, setAgencyData] = useState({
    agency_name: "",
    tagline: "",
    website_url: "",
    contact_email: "",
    logo_url: "",
    primary_color: "#0F172A",
    secondary_color: "#3B82F6",
    font_family: "Inter",
    brand_tone: "Professional and Direct",
    base_hourly_rate: 50,
    currency: "USD",
    timezone: "Asia/Karachi",
  });
  const [agencySkills, setAgencySkills] = useState<string[]>([]);
  const [agencySkillInput, setAgencySkillInput] = useState("");
  const [agencyTechStack, setAgencyTechStack] = useState<string[]>([]);
  const [agencyTechInput, setAgencyTechInput] = useState("");

  // Total steps depends on user type
  const totalSteps = userType === "agency" ? 5 : 4;
  const progress = (step / totalSteps) * 100;

  // â”€â”€â”€ Tag helpers â”€â”€â”€
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
  const addAgencySkill = () => {
    const val = agencySkillInput.trim();
    if (val && !agencySkills.includes(val)) setAgencySkills([...agencySkills, val]);
    setAgencySkillInput("");
  };
  const addAgencyTech = () => {
    const val = agencyTechInput.trim();
    if (val && !agencyTechStack.includes(val)) setAgencyTechStack([...agencyTechStack, val]);
    setAgencyTechInput("");
  };

  // â”€â”€â”€ Handle user type selection â”€â”€â”€
  const handleUserTypeSelect = (type: "individual" | "agency") => {
    setUserType(type);
    setStep(2); // Move to next step
  };

  // â”€â”€â”€ Final Submit â”€â”€â”€
  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Save preferences via PATCH /api/user/preferences
      const prefsRes = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          experience_level: experienceLevel,
          min_budget: minBudget,
          preferred_markets: preferredMarkets,
          opportunity_types: opportunityTypes,
          target_client: targetClients,
        }),
      });

      if (!prefsRes.ok) {
        const data = await prefsRes.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      // 2. If agency, save agency profile via PUT /api/agency-profile
      if (userType === "agency") {
        const agencyPayload = {
          ...agencyData,
          base_hourly_rate: Number(agencyData.base_hourly_rate) || 0,
          core_skills: agencySkills,
          preferred_tech_stack: agencyTechStack,
        };

        const agencyRes = await fetch("/api/agency-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(agencyPayload),
        });

        if (!agencyRes.ok) {
          const data = await agencyRes.json();
          throw new Error(data.error || "Failed to save agency profile");
        }
      }

      toast.success("Setup complete! Welcome to GigThink!");
      router.push("/feed"); // Redirect to main app
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€â”€ Render â”€â”€â”€
  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold heading-gradient">Set Up Your Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-6 sm:p-8 brand-border shadow-xl">
          {/* STEP 1: USER TYPE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-5 w-5" />
                <h2 className="font-semibold">Who are you?</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the option that best describes you. This helps us tailor your experience.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Individual Option */}
                <button
                  onClick={() => handleUserTypeSelect("individual")}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left space-y-3"
                >
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Individual Freelancer</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You work solo and manage projects yourself.
                    </p>
                  </div>
                </button>

                {/* Agency Option */}
                <button
                  onClick={() => handleUserTypeSelect("agency")}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left space-y-3"
                >
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Agency Owner</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You run a team or company offering services.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SKILLS & EXPERIENCE */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Tag className="h-5 w-5" />
                <h2 className="font-semibold">Skills & Experience</h2>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="gap-1">
                      {skill}
                      <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="ml-1 hover:text-red-400">
                        Ã—
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="e.g., React, Node.js"
                    className="bg-white/5 border-white/10"
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <div className="flex gap-2">
                  {EXPERIENCE_OPTIONS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border",
                        experienceLevel === level
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET & MARKETS */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="h-5 w-5" />
                <h2 className="font-semibold">Budget & Markets</h2>
              </div>

              {/* Minimum Budget */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Budget (USD)</label>
                <Input
                  type="number"
                  min={0}
                  value={minBudget}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  className="bg-white/5 border-white/10"
                />
              </div>

              {/* Preferred Markets */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Markets</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {preferredMarkets.map((market) => (
                    <Badge key={market} variant="outline" className="gap-1">
                      {market}
                      <button onClick={() => setPreferredMarkets(preferredMarkets.filter(m => m !== market))} className="ml-1 hover:text-red-400">
                        Ã—
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
                    className="bg-white/5 border-white/10"
                  />
                  <Button type="button" variant="outline" onClick={addMarket}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: OPPORTUNITY TYPES & CLIENTS */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Briefcase className="h-5 w-5" />
                <h2 className="font-semibold">Opportunity Types & Clients</h2>
              </div>

              {/* Opportunity Types */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Opportunity Types</label>
                <div className="flex flex-wrap gap-2">
                  {OPPORTUNITY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setOpportunityTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border",
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
                <label className="text-sm font-medium">Target Client Types</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {targetClients.map((client) => (
                    <Badge key={client} variant="outline" className="gap-1">
                      {client}
                      <button onClick={() => setTargetClients(targetClients.filter(c => c !== client))} className="ml-1 hover:text-red-400">
                        Ã—
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
                    className="bg-white/5 border-white/10"
                  />
                  <Button type="button" variant="outline" onClick={addTargetClient}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: AGENCY DETAILS (only if agency) */}
          {step === 5 && userType === "agency" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <h2 className="font-semibold">Agency Details</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Let's set up your agency branding and details for proposals.
              </p>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Agency Name *</label>
                  <Input
                    value={agencyData.agency_name}
                    onChange={(e) => setAgencyData({ ...agencyData, agency_name: e.target.value })}
                    placeholder="e.g. Apex Software Solutions"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Tagline</label>
                  <Input
                    value={agencyData.tagline}
                    onChange={(e) => setAgencyData({ ...agencyData, tagline: e.target.value })}
                    placeholder="Building high-performance apps"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Website URL</label>
                  <Input
                    value={agencyData.website_url}
                    onChange={(e) => setAgencyData({ ...agencyData, website_url: e.target.value })}
                    placeholder="https://apexagency.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Contact Email</label>
                  <Input
                    type="email"
                    value={agencyData.contact_email}
                    onChange={(e) => setAgencyData({ ...agencyData, contact_email: e.target.value })}
                    placeholder="hello@apexagency.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Logo URL</label>
                  <Input
                    value={agencyData.logo_url}
                    onChange={(e) => setAgencyData({ ...agencyData, logo_url: e.target.value })}
                    placeholder="https://apexagency.com/logo.png"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Brand Tone</label>
                  <Select
                    value={agencyData.brand_tone}
                    onValueChange={(val) => setAgencyData({ ...agencyData, brand_tone: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAND_TONES.map((tone) => (
                        <SelectItem key={tone} value={tone} className="text-xs">{tone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Branding Colors & Font */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-8 w-10 rounded border border-white/10 bg-transparent"
                      value={agencyData.primary_color}
                      onChange={(e) => setAgencyData({ ...agencyData, primary_color: e.target.value })}
                    />
                    <Input
                      value={agencyData.primary_color}
                      onChange={(e) => setAgencyData({ ...agencyData, primary_color: e.target.value })}
                      className="flex-1 bg-white/5 border-white/10 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-8 w-10 rounded border border-white/10 bg-transparent"
                      value={agencyData.secondary_color}
                      onChange={(e) => setAgencyData({ ...agencyData, secondary_color: e.target.value })}
                    />
                    <Input
                      value={agencyData.secondary_color}
                      onChange={(e) => setAgencyData({ ...agencyData, secondary_color: e.target.value })}
                      className="flex-1 bg-white/5 border-white/10 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Font Family</label>
                  <Select
                    value={agencyData.font_family}
                    onValueChange={(val) => setAgencyData({ ...agencyData, font_family: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font} className="text-xs">{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Core Skills & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Core Skills</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agencySkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="gap-1 text-[10px]">
                        {skill}
                        <button onClick={() => setAgencySkills(agencySkills.filter(s => s !== skill))} className="ml-1 hover:text-red-400">
                          Ã—
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={agencySkillInput}
                      onChange={(e) => setAgencySkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAgencySkill(); } }}
                      placeholder="e.g. Web Development"
                      className="bg-white/5 border-white/10 h-8 text-xs"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addAgencySkill}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Tech Stack</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agencyTechStack.map((tech) => (
                      <Badge key={tech} className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
                        {tech}
                        <button onClick={() => setAgencyTechStack(agencyTechStack.filter(t => t !== tech))} className="ml-1 hover:text-red-400">
                          Ã—
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={agencyTechInput}
                      onChange={(e) => setAgencyTechInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAgencyTech(); } }}
                      placeholder="e.g. Next.js, Supabase"
                      className="bg-white/5 border-white/10 h-8 text-xs"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addAgencyTech}>Add</Button>
                  </div>
                </div>
              </div>

              {/* Rates & Region */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Hourly Rate</label>
                  <Input
  type="number"
  value={agencyData.base_hourly_rate}
  onChange={(e) => setAgencyData({ ...agencyData, base_hourly_rate: Number(e.target.value) || 0 })}
  className="bg-white/5 border-white/10"
/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Currency</label>
                  <Select
                    value={agencyData.currency}
                    onValueChange={(val) => setAgencyData({ ...agencyData, currency: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem key={cur} value={cur} className="text-xs">{cur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Timezone</label>
                  <Select
                    value={agencyData.timezone}
                    onValueChange={(val) => setAgencyData({ ...agencyData, timezone: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || loading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} className="gap-1">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}