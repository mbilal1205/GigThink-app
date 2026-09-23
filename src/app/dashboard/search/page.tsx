"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Mail,
  MapPin,
  TrendingUp,
  Save,
  Sparkles,
  List,
  LayoutGrid,
  History,
  ChevronDown,
  Zap,
  Globe,
  Phone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuickPitchModal } from "@/components/leads/QuickPitchModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// â”€â”€â”€ STRICT TYPES (No more 'any' errors) â”€â”€â”€
interface Lead {
  id: string;
  businessName: string;
  niche: string;
  location: string;
  phone: string;
  website: string | null;
  email: string;
  rating: number;
  leadTemperature: "Hot" | "Warm" | "Cold";
}

interface SearchHistoryItem {
  id: string;
  query: string;
  city: string;
  niche: string | null;
  results_count: number;
  results_json: Lead[];
}

// â”€â”€â”€ ERROR-FREE MOTION VARIANTS â”€â”€â”€
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: "easeOut" as const } 
  },
};

// â”€â”€â”€ QUICK SEARCH PRESETS (Facilitates different search methods) â”€â”€â”€
const quickPresets = [
  { query: "Dental Clinic", city: "Lahore", niche: "Healthcare" },
  { query: "Real Estate Agency", city: "Karachi", niche: "Real Estate" },
  { query: "Gym & Fitness", city: "Islamabad", niche: "Fitness" },
  { query: "Software House", city: "Rawalpindi", niche: "Technology" },
];

export default function LeadFinderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pitchLead, setPitchLead] = useState<Lead | null>(null);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [fullProposalLoading, setFullProposalLoading] = useState<string | null>(null);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/leads/search-history");
      const data = await res.json();
      if (res.ok) setHistory(data.history || []);
    } catch (error) {
      console.error("History fetch failed", error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || !city.trim()) {
      toast.error("Please enter both business type and city");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, city, niche }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setLeads(data.leads || []);
      toast.success(`Found ${data.leads?.length || 0} high-quality leads!`);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (preset: typeof quickPresets[0]) => {
    setQuery(preset.query);
    setCity(preset.city);
    setNiche(preset.niche);
    // Trigger search automatically for seamless UX
    setTimeout(() => {
      // We need to call the actual search logic, but since state updates are async, 
      // we can just pass the values directly to a modified search or let the user click.
      // For better UX, let's just set state and let them click, or we can do:
    }, 100);
  };

  const handleSaveLead = async (lead: Lead) => {
    if (savedIds.has(lead.id)) return;
    try {
      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedIds((prev) => new Set(prev).add(lead.id));
      toast.success("Lead saved to your pipeline!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFullProposal = async (lead: Lead) => {
    setFullProposalLoading(lead.id);
    try {
      const res = await fetch("/api/leads/generate-full-proposal-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proposal generation failed");
      toast.success("Full proposal created successfully!");
      if (data.projectId) {
        router.push(`/projects/${data.projectId}/proposal`);
      } else {
        router.push("/projects/list");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFullProposalLoading(null);
    }
  };

  const openPitchModal = (lead: Lead) => {
    setPitchLead(lead);
    setPitchModalOpen(true);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] hero-glow pointer-events-none opacity-60" />

      {/* â”€â”€â”€ HEADER â”€â”€â”€ */}
      <div className="relative z-10 space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold heading-gradient tracking-tight">
          AI Lead Finder
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Discover high-intent local businesses and generate AI-powered pitches in seconds.
        </p>
      </div>

      {/* â”€â”€â”€ SEARCH HUB â”€â”€â”€ */}
      <div className="relative z-10 space-y-4">
        <Card className="glass brand-glow rounded-2xl border-border/50 overflow-hidden">
          <CardContent className="p-6 space-y-5">
            
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">
                Quick Search:
              </span>
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(preset.query);
                    setCity(preset.city);
                    setNiche(preset.niche);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  {preset.query} in {preset.city}
                </button>
              ))}
            </div>

            {/* Main Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Business type (e.g., Dental Clinic)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-12 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-xl text-sm"
                />
              </div>
              <div className="md:col-span-4 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="City (e.g., San Francisco)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-9 h-12 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-xl text-sm"
                />
              </div>
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Niche (Optional)"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="pl-9 h-12 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-xl text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full h-12 btn-gradient text-primary-foreground font-semibold gap-2 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {loading ? "Searching..." : "Find Leads"}
                </Button>
              </div>
            </div>

            {/* History Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <History className="h-3.5 w-3.5 group-hover:text-primary" /> 
                Recent Searches
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showHistory && "rotate-180"
                  )}
                />
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                      {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No past searches found.</p>
                      ) : (
                        history.map((h) => (
                          <button
                            key={h.id}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-accent/40 hover:border-primary/30 transition-all text-left group"
                            onClick={() => {
                              setQuery(h.query);
                              setCity(h.city);
                              setNiche(h.niche || "");
                              setLeads(h.results_json);
                              setShowHistory(false);
                              toast.info("Loaded previous search results");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {h.query} in {h.city}
                              </span>
                              {h.niche && (
                                <span className="text-[10px] text-muted-foreground">{h.niche}</span>
                              )}
                            </div>
                            <Badge variant="outline" className="text-[10px] border-border/50">
                              {h.results_count} leads
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€â”€ RESULTS AREA â”€â”€â”€ */}
      <AnimatePresence mode="wait">
        {leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 space-y-4"
          >
            {/* View Toggle */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Search Results
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {leads.length}
                </Badge>
              </h3>
              <div className="flex glass rounded-lg p-1 border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "gap-2 rounded-md transition-all",
                    viewMode === "cards" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" /> Cards
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "gap-2 rounded-md transition-all",
                    viewMode === "table" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-4 w-4" /> Table
                </Button>
              </div>
            </div>

            {viewMode === "cards" ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {leads.map((lead) => (
                  <motion.div key={lead.id} variants={itemVariants}>
                    <Card className="glass card-hover rounded-xl border-border/50 h-full flex flex-col">
                      <CardContent className="p-5 flex flex-col flex-1 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
                            {lead.businessName}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5",
                              lead.leadTemperature === "Hot"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : lead.leadTemperature === "Warm"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {lead.leadTemperature}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" /> 
                            <span className="line-clamp-1">{lead.location}</span>
                          </p>
                          {lead.website && (
                            <p className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-primary/70 shrink-0" /> 
                              <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors line-clamp-1">
                                {lead.website.replace(/^https?:\/\//, "").replace("www.", "")}
                              </a>
                            </p>
                          )}
                          {lead.email && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-primary/70 shrink-0" /> 
                              <span className="line-clamp-1">{lead.email}</span>
                            </p>
                          )}
                        </div>

                        <div className="divider my-1" />

                        <div className="grid grid-cols-3 gap-2 mt-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-border/50 hover:bg-accent/40"
                            onClick={() => handleSaveLead(lead)}
                            disabled={savedIds.has(lead.id)}
                          >
                            {savedIds.has(lead.id) ? (
                              <span className="text-emerald-400 flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Saved</span>
                            ) : (
                              <><Save className="h-3.5 w-3.5" /> Save</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="h-9 text-xs gap-1.5 btn-gradient text-primary-foreground"
                            onClick={() => openPitchModal(lead)}
                          >
                            <Mail className="h-3.5 w-3.5" /> Pitch
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                            onClick={() => handleFullProposal(lead)}
                            disabled={fullProposalLoading === lead.id}
                          >
                            {fullProposalLoading === lead.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Zap className="h-3.5 w-3.5" />
                            )}
                            Full
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="glass rounded-xl border-border/50 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="text-muted-foreground font-medium">Business</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Location</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Temp</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead, idx) => (
                        <TableRow key={lead.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors group">
                          <TableCell className="font-medium text-sm text-foreground">
                            <div className="flex flex-col gap-1">
                              <span>{lead.businessName}</span>
                              <span className="text-xs text-muted-foreground font-normal">{lead.niche}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/60" /> {lead.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col gap-1">
                              {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                              {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold",
                                lead.leadTemperature === "Hot"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : lead.leadTemperature === "Warm"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              )}
                            >
                              {lead.leadTemperature}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => handleSaveLead(lead)}
                                disabled={savedIds.has(lead.id)}
                                title="Save Lead"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => openPitchModal(lead)}
                                title="Quick Pitch"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10"
                                onClick={() => handleFullProposal(lead)}
                                disabled={fullProposalLoading === lead.id}
                                title="Full Proposal"
                              >
                                {fullProposalLoading === lead.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State (Optional but good for UX) */}
      {!loading && leads.length === 0 && query === "" && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="relative z-10 text-center py-16 glass rounded-2xl border border-dashed border-border/50"
        >
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-muted-foreground opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Ready to find your next client?</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Enter a business type and city above, or click on a quick search preset to get started.
          </p>
        </motion.div>
      )}

      {/* Quick Pitch Modal */}
      {pitchLead && (
        <QuickPitchModal
          lead={pitchLead}
          open={pitchModalOpen}
          onOpenChange={setPitchModalOpen}
        />
      )}
    </div>
  );
}