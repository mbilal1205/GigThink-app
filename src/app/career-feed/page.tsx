"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Inbox,
  AlertCircle,
  X,
  Sparkles,
  Flame,
  Clock,
  Compass,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import JobCard from "@/components/jobs/JobCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match", icon: Sparkles },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "salary_high", label: "High Salary", icon: TrendingUp },
  { value: "remote", label: "Remote First", icon: MapPin },
];

const REMOTE_OPTIONS = [
  { value: "", label: "All", emoji: null },
  { value: "remote", label: "Remote", emoji: "ðŸŒŽ" },
  { value: "hybrid", label: "Hybrid", emoji: "ðŸ¢" },
  { value: "onsite", label: "Onsite", emoji: "ðŸ“" },
];

export default function CareerFeedPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("best_match");
  const [remoteType, setRemoteType] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [minSalary, setMinSalary] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({ remoteType, minMatch, minSalary }),
    [remoteType, minMatch, minSalary]
  );

  const hasActiveFilters = remoteType !== "" || minMatch > 0 || minSalary !== "";

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
    queryKey: ["career-feed", debouncedSearch, sort, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", sort);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.remoteType) params.set("remote_type", filters.remoteType);
      if (filters.minMatch > 0) params.set("min_match", String(filters.minMatch));
      if (filters.minSalary) params.set("min_salary", filters.minSalary);

      const res = await fetch(`/api/career-feed?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to view career feed");
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  // Flatten and deduplicate
  const allJobs = data?.pages.flatMap((page) => page.jobs) ?? [];
  const uniqueJobs = Array.from(
    new Map(allJobs.map((job) => [job.id, job])).values()
  );

  // Client-side filtering for search (in addition to server)
  const filteredJobs = useMemo(() => {
    let result = uniqueJobs;
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [uniqueJobs, debouncedSearch]);

  const isSearching = isFetching && !isFetchingNextPage && !isLoading;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastJobRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const clearAll = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setRemoteType("");
    setMinMatch(0);
    setMinSalary("");
  };

  if (isLoading) {
    return <CareerFeedSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center glass rounded-2xl p-8 border-border/50"
        >
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] hero-glow pointer-events-none opacity-50" />

      {/* Subtle top loading bar */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-50 origin-left"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="space-y-5"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold heading-gradient tracking-tight flex items-center justify-center gap-3">
              <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              Your Career Feed
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              AI-curated job opportunities based on your skills, preferences, and salary expectations.
            </p>
          </div>

          {/* Big Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by title, company, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-14 pr-14 h-14 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-2xl text-base focus-brand shadow-lg shadow-black/10 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Remote Chips */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/30">
              {REMOTE_OPTIONS.map((opt) => {
                const isActive = remoteType === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    onClick={() => setRemoteType(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent"
                    )}
                  >
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 bg-muted/30 border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer hover:bg-accent/40 transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 h-9 px-3 text-xs border-border/50 hover:bg-accent/40 rounded-lg transition-all",
                (showAdvancedFilters || hasActiveFilters) && "bg-primary/10 text-primary border-primary/30"
              )}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Advanced
              {hasActiveFilters && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Button>

            {/* Clear All */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters (Expandable) */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto pt-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Minimum Match Score: {minMatch}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minMatch}
                      onChange={(e) => setMinMatch(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Minimum Salary (USD)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 100000"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="h-10 bg-muted/30 border-border/50 focus-visible:ring-primary/30 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="divider h-px w-full" />

        {/* Results Header */}
        {!isLoading && filteredJobs.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1">
                {filteredJobs.length} jobs
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {sort === "best_match" && "Sorted by AI match"}
                {sort === "newest" && "Newest first"}
                {sort === "salary_high" && "Highest salary first"}
                {sort === "remote" && "Remote jobs first"}
              </span>
            </div>
            {isSearching && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="hidden sm:inline">Updating...</span>
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center py-20 glass rounded-2xl border border-dashed border-border/50"
          >
            <div className="rounded-full bg-muted/50 p-5">
              <Inbox className="h-10 w-10 text-muted-foreground opacity-60" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No jobs found</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your filters, search terms, or complete your candidate profile for better matches.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="border-border/50 hover:bg-accent/40"
            >
              Clear All Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, index) => {
                const isLast = index === filteredJobs.length - 1;
                return (
                  <motion.div
                    key={job.id}
                    ref={isLast ? lastJobRef : undefined}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" as const }}
                    className="card-hover rounded-2xl"
                  >
                    <JobCard job={job} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Infinite Scroll Indicators */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/30">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading more jobs...</span>
            </div>
          </div>
        )}

        {!hasNextPage && filteredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">
                ðŸŽ‰ You've seen all the jobs!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ PREMIUM SKELETON â”€â”€â”€
function CareerFeedSkeleton() {
  return (
    <div className="relative w-full min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] hero-glow pointer-events-none opacity-50" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Skeleton */}
        <div className="space-y-5">
          <div className="text-center space-y-3">
            <div className="h-10 w-64 mx-auto bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-4 w-80 mx-auto bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="h-14 max-w-2xl mx-auto bg-muted/50 rounded-2xl animate-pulse" />
          <div className="h-11 w-80 mx-auto bg-muted/50 rounded-xl animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex justify-center gap-2">
          <div className="h-9 w-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-muted/50 rounded-lg animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-2xl border-border/50 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-muted/50 rounded-lg" />
                  <div className="h-3 w-1/2 bg-muted/50 rounded-lg" />
                </div>
              </div>
              <div className="h-20 bg-muted/50 rounded-xl" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-muted/50 rounded-lg" />
                <div className="h-8 w-20 bg-muted/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}