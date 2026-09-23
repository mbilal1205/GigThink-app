"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Loader2,
  AlertCircle,
  Inbox,
  Sparkles,
  Clock,
  TrendingUp,
  Target,
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  ShieldCheck,
  Gauge,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import OpportunityCard from "@/components/OpportunityCard";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  location: string;
  is_remote: boolean;
  job_type: string;
  skills: string[];
  posted_at: string;
  source_url: string;
  score: number;
  why_this: string[];
  client_quality: string;
  competition_estimate: string;
}

const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match", icon: Sparkles },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "budget_high", label: "High Budget", icon: TrendingUp },
  { value: "low_competition", label: "Low Competition", icon: Target },
];

const REMOTE_OPTIONS = [
  { value: "", label: "All", emoji: null },
  { value: "remote", label: "Remote", emoji: "ðŸŒŽ" },
  { value: "onsite", label: "Onsite", emoji: "ðŸ“" },
];

const JOB_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "contract", label: "Contract" },
];

const CLIENT_QUALITY_OPTIONS = [
  { value: "", label: "Any Quality" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const COMPETITION_OPTIONS = [
  { value: "", label: "Any Competition" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const PAGE_SIZE = 10;

export default function FeedPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("best_match");

  // Advanced filters (client-side only, applied to already-loaded results)
  const [remoteType, setRemoteType] = useState("");
  const [jobType, setJobType] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [clientQuality, setClientQuality] = useState("");
  const [competition, setCompetition] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // â”€â”€â”€ DEBOUNCED SEARCH (400ms for snappier feel) â”€â”€â”€
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed", debouncedSearch, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("sort", sort);
      params.set("page", String(pageParam));
      params.set("limit", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to see your feed.");
        throw new Error("Failed to fetch opportunities");
      }
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) return lastPage.page + 1;
      return undefined;
    },
    placeholderData: keepPreviousData, // Keeps previous data during refetch
    staleTime: 20 * 1000,
  });

  const allJobs = data?.pages.flatMap((page) => page.opportunities) ?? [];
  const uniqueJobs = Array.from(
    new Map(allJobs.map((job) => [job.id, job])).values()
  );

  // â”€â”€â”€ CLIENT-SIDE FILTERING (Only for advanced filters, NOT search) â”€â”€â”€
  const filteredOpportunities = useMemo(() => {
    let result = uniqueJobs;

    // Remote type
    if (remoteType) {
      result = result.filter((opp) =>
        remoteType === "remote" ? opp.is_remote : !opp.is_remote
      );
    }

    // Job type
    if (jobType) {
      result = result.filter((opp) => opp.job_type?.toLowerCase() === jobType);
    }

    // Budget range
    if (minBudget) {
      const min = Number(minBudget);
      if (!isNaN(min)) result = result.filter((opp) => (opp.budget_max || 0) >= min);
    }
    if (maxBudget) {
      const max = Number(maxBudget);
      if (!isNaN(max)) result = result.filter((opp) => (opp.budget_min || 0) <= max);
    }

    // Client quality
    if (clientQuality) {
      result = result.filter((opp) => opp.client_quality?.toLowerCase() === clientQuality);
    }

    // Competition
    if (competition) {
      result = result.filter((opp) => opp.competition_estimate?.toLowerCase() === competition);
    }

    return result;
  }, [uniqueJobs, remoteType, jobType, minBudget, maxBudget, clientQuality, competition]);

  const hasActiveFilters =
    remoteType || jobType || minBudget || maxBudget || clientQuality || competition;

  // Subtle loading indicator (not full skeleton)
  const isSearching = isFetching && !isFetchingNextPage && !isLoading;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const clearAll = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setRemoteType("");
    setJobType("");
    setMinBudget("");
    setMaxBudget("");
    setClientQuality("");
    setCompetition("");
  };

  // â”€â”€â”€ INITIAL FULL PAGE LOADING â”€â”€â”€
  if (isLoading) {
    return <FeedSkeleton />;
  }

  // â”€â”€â”€ ERROR STATE â”€â”€â”€
  if (error && !isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col items-center gap-4 text-center glass rounded-2xl p-8 border-border/50">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-border/50 hover:bg-accent/40"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] hero-glow pointer-events-none opacity-50" />

      {/* â”€â”€â”€ SUBTLE TOP LOADING BAR (fixed, no layout shift) â”€â”€â”€ */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-[60] transition-opacity duration-300",
          isSearching ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* â”€â”€â”€ HERO SECTION (sticky-friendly, no jump) â”€â”€â”€ */}
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-3 py-1 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Curated Opportunities
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold heading-gradient tracking-tight leading-[1.1]">
              Your Opportunity Feed
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover high-match projects tailored to your skills and preferences.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by title, company, or skills..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-14 pr-12 h-13 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-2xl text-base focus-brand shadow-xl shadow-black/10 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Tabs + Filters Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {/* Sort Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/30 overflow-x-auto no-scrollbar max-w-full">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{opt.label}</span>
                    <span className="sm:hidden">{opt.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Advanced Toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 h-9 px-3 text-xs border-border/50 hover:bg-accent/40 rounded-lg transition-all shrink-0",
                (showAdvancedFilters || hasActiveFilters) && "bg-primary/10 text-primary border-primary/30"
              )}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters Panel (smooth expand) */}
          {showAdvancedFilters && (
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-9 bg-muted/30 border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {JOB_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Quality</label>
                <select
                  value={clientQuality}
                  onChange={(e) => setClientQuality(e.target.value)}
                  className="w-full h-9 bg-muted/30 border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CLIENT_QUALITY_OPTIONS.map((opt) => (
                    <option key={opt.value || "any"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Competition</label>
                <select
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  className="w-full h-9 bg-muted/30 border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {COMPETITION_OPTIONS.map((opt) => (
                    <option key={opt.value || "any"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Budget ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="h-9 bg-muted/30 border-border/50 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Budget ($)</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="h-9 bg-muted/30 border-border/50 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div className="divider h-px w-full" />

        {/* â”€â”€â”€ RESULTS HEADER (Stable, no layout shift) â”€â”€â”€ */}
        <div className="flex items-center justify-between min-h-[32px]">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
              {filteredOpportunities.length} opportunities
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {sort === "best_match" && "Ranked by AI match score"}
              {sort === "newest" && "Most recently posted"}
              {sort === "budget_high" && "Highest paying first"}
              {sort === "low_competition" && "Easiest to win"}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground transition-opacity duration-200",
              isSearching ? "opacity-100" : "opacity-0"
            )}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline">Updating...</span>
          </div>
        </div>

        {/* â”€â”€â”€ GRID FEED (with min-height to prevent jump) â”€â”€â”€ */}
        <div className="min-h-[400px]">
          {filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-center py-20 glass rounded-2xl border border-dashed border-border/50">
              <div className="rounded-full bg-muted/50 p-5">
                <Inbox className="h-10 w-10 text-muted-foreground opacity-60" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">No opportunities found</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try adjusting filters or search terms.
              </p>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity duration-300",
                isSearching ? "opacity-60" : "opacity-100"
              )}
            >
              {filteredOpportunities.map((opp, index) => {
                const isLast = index === filteredOpportunities.length - 1;
                return (
                  <div
                    key={opp.id}
                    ref={isLast ? lastCardRef : undefined}
                    className="card-hover rounded-2xl"
                  >
                    <OpportunityCard opportunity={opp} />
                  </div>
                );
              })}

              {isFetchingNextPage && (
                <>
                  <div className="glass rounded-2xl border-border/50 p-6 space-y-4 animate-pulse">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted/50 rounded-lg" />
                        <div className="h-3 w-1/2 bg-muted/50 rounded" />
                      </div>
                      <div className="h-8 w-16 bg-muted/50 rounded-full" />
                    </div>
                    <div className="h-16 bg-muted/50 rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 bg-muted/50 rounded-full" />
                      <div className="h-7 w-20 bg-muted/50 rounded-full" />
                    </div>
                  </div>
                  <div className="glass rounded-2xl border-border/50 p-6 space-y-4 animate-pulse hidden md:block">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted/50 rounded-lg" />
                        <div className="h-3 w-1/2 bg-muted/50 rounded" />
                      </div>
                      <div className="h-8 w-16 bg-muted/50 rounded-full" />
                    </div>
                    <div className="h-16 bg-muted/50 rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 bg-muted/50 rounded-full" />
                      <div className="h-7 w-20 bg-muted/50 rounded-full" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* â”€â”€â”€ END OF FEED â”€â”€â”€ */}
        {!hasNextPage && filteredOpportunities.length > 0 && !isFetchingNextPage && (
          <div className="text-center py-8">
            <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm text-foreground font-medium">You're all caught up!</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Check back later for new AI-matched opportunities.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ PREMIUM SKELETON â”€â”€â”€
function FeedSkeleton() {
  return (
    <div className="relative w-full min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] hero-glow pointer-events-none opacity-50" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <div className="h-6 w-48 bg-muted/50 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-10 w-80 max-w-full mx-auto bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-4 w-[400px] max-w-full mx-auto bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="h-13 max-w-2xl mx-auto bg-muted/50 rounded-2xl animate-pulse" />
          <div className="flex justify-center gap-2 pt-1">
            <div className="h-9 w-[400px] max-w-full bg-muted/50 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="divider h-px w-full" />
        <div className="flex items-center justify-between min-h-[32px]">
          <div className="h-7 w-32 bg-muted/50 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl border-border/50 p-6 space-y-4 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-muted/50 rounded-lg" />
                  <div className="h-3 w-1/2 bg-muted/50 rounded" />
                </div>
                <div className="h-8 w-16 bg-muted/50 rounded-full" />
              </div>
              <div className="h-16 bg-muted/50 rounded-xl" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-muted/50 rounded-full" />
                <div className="h-7 w-20 bg-muted/50 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}