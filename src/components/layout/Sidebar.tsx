"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Search,
  Bot,
  Users,
  FolderKanban,
  Rss,
  User,
  Settings,
  ChevronDown,
  Sparkles,
  Zap,
  Menu,
  X,
  ListChecks,
  Loader2,
  Crown,
  Flame,
  Mail,
  FileText,
  Briefcase,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

// â”€â”€â”€ NAVIGATION GROUPS â”€â”€â”€
const mainNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Lead Finder", href: "/dashboard/search", icon: Search, badge: "AI" },
  { name: "Agent", href: "/agent", icon: Search, badge: "AI" },
  { name: "My Leads", href: "/dashboard/search/leads", icon: ListChecks },
];

const feedItems = [
  { name: "Opportunity Feed", href: "/feed", icon: Rss, description: "AI-curated freelance projects" },
  { name: "Leads Feed", href: "/leads-feed", icon: Flame, description: "Community-sourced business leads" },
  { name: "Career Feed", href: "/career-feed", icon: Briefcase, description: "Full-time job opportunities" },
];

const workspaceNavItems = [
  { name: "Ai Parser", href: "/parser", icon: Sparkles },
  { name: "Auto Follow-ups", href: "/follow-ups", icon: Mail, badge: "New" },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects/list", icon: FolderKanban },
];

const profileNavItems = [
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Candidate Profile", href: "/candidate-profile", icon: User },
];

function CreditsCard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits");
        const data = await res.json();
        if (res.ok) {
          setCredits(data.credits);
          setIsPremium(data.isPremium);
        }
      } catch (err) {
        console.error("[CREDITS_FETCH]", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Crown className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400">Premium Active</p>
            <p className="text-[10px] text-muted-foreground">Unlimited AI Credits</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const maxCredits = 100;
  const percent = Math.min(100, ((credits || 0) / maxCredits) * 100);
  const isLow = credits !== null && credits <= 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-3 rounded-xl border",
        isLow
          ? "bg-red-500/10 border-red-500/30"
          : "bg-white/5 border-white/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-sidebar-foreground flex items-center gap-1.5">
          <Zap className={cn("h-3.5 w-3.5", isLow ? "text-red-400 animate-pulse" : "text-primary")} />
          AI Credits
        </span>
        <span className={cn("text-xs font-bold", isLow ? "text-red-400" : "text-primary")}>
          {credits ?? 0}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isLow ? "bg-red-500" : "bg-gradient-to-r from-primary to-emerald-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {isLow && (
        <p className="text-[10px] text-red-400 mt-1.5 font-medium">
          Low credits â€” upgrade to continue
        </p>
      )}
    </motion.div>
  );
}

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between p-4 select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          "glass rounded-r-2xl md:rounded-none border-r border-white/5 shadow-2xl shadow-black/20",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col h-full gap-5 overflow-y-auto">
          {/* Workspace Switcher */}
          <div className="group relative">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                  G
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-sidebar-foreground truncate heading-gradient">
                    Gig Think's Workspace
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Agency Plan
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-muted-foreground shrink-0 transition-transform group-hover:rotate-180" />
            </div>
          </div>

          <nav className="flex flex-col gap-5 flex-1">
            {/* Main */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                Main
              </div>
              {mainNavItems.map((item) => (
                <NavItem key={item.name} item={item} pathname={pathname} setMobileOpen={setMobileOpen} />
              ))}
            </div>

            {/* Feeds Dropdown */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                Feeds
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative overflow-hidden",
                      feedItems.some((feed) => pathname.startsWith(feed.href))
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="relative z-10 flex items-center gap-2.5">
                      <Rss
                        size={16}
                        className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          feedItems.some((feed) => pathname.startsWith(feed.href))
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-white"
                        )}
                      />
                      <span>Feeds</span>
                    </div>
                    <ChevronDown size={14} className="relative z-10 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-56 border-white/10 bg-card/95 backdrop-blur-md text-foreground"
                >
                  {feedItems.map((feed) => {
                    const isActive = pathname.startsWith(feed.href);
                    return (
                      <DropdownMenuItem key={feed.name} asChild>
                        <Link
                          href={feed.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-start gap-3 px-3 py-2 text-xs hover:bg-white/5"
                        >
                          <feed.icon className={cn("h-4 w-4 mt-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="font-medium">{feed.name}</p>
                            <p className="text-[10px] text-muted-foreground">{feed.description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Workspace */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                Workspace
              </div>
              {workspaceNavItems.map((item) => (
                <NavItem key={item.name} item={item} pathname={pathname} setMobileOpen={setMobileOpen} />
              ))}
            </div>

            {/* Profile & Settings */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                Profile & Settings
              </div>
              {profileNavItems.map((item) => (
                <NavItem key={item.name} item={item} pathname={pathname} setMobileOpen={setMobileOpen} />
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative overflow-hidden",
                      pathname.startsWith("/settings")
                        ? "bg-primary shadow-lg shadow-primary/25 text-primary-foreground font-semibold"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="relative z-10 flex items-center gap-2.5">
                      <Settings
                        size={16}
                        className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          pathname.startsWith("/settings")
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-white"
                        )}
                      />
                      <span>Settings</span>
                    </div>
                    <ChevronDown size={14} className="relative z-10" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-48 border-white/10 bg-card/95 backdrop-blur-md text-foreground"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/settings/connections" className="text-xs">App Connections</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="text-xs">Profile Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>

        {/* Bottom: Credits + Upgrade */}
        <div className="pt-4 border-t border-white/5 space-y-3 mt-4">
          <CreditsCard />

          <Link
            href="/settings/agency"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/15 hover:border-primary/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shadow-md shadow-primary/20">
                <Zap size={15} className="text-primary animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-sidebar-foreground group-hover:text-primary transition-colors">
                  Upgrade Engine
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Unlock unlimited AI
                </span>
              </div>
            </div>
            <Sparkles size={14} className="text-primary relative z-10" />
          </Link>
        </div>
      </aside>
    </>
  );
}

// â”€â”€â”€ Reusable NavItem component â”€â”€â”€
function NavItem({
  item,
  pathname,
  setMobileOpen,
}: {
  item: { name: string; href: string; icon: any; badge?: string };
  pathname: string | null;
  setMobileOpen: (open: boolean) => void;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname?.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative overflow-hidden",
        isActive
          ? "bg-primary shadow-lg shadow-primary/25 text-primary-foreground font-semibold"
          : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      {isActive && (
        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-transparent opacity-50" />
      )}
      <div className="relative z-10 flex items-center gap-2.5">
        <Icon
          size={16}
          className={cn(
            "transition-transform duration-200 group-hover:scale-110",
            isActive
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-white"
          )}
        />
        <span>{item.name}</span>
      </div>

      {item.badge && (
        <Badge
          variant="outline"
          className={cn(
            "relative z-10 text-[9px] px-1.5 py-0 border-none font-bold",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/20 text-primary"
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}