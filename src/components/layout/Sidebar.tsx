import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Building2, 
  GraduationCap, 
  FlaskConical, 
  Rocket, 
  Users, 
  Calendar, 
  Plus,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Bell,
  User,
  Settings,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import alsamosLogo from "@/assets/alsamos-logo.png";
import SearchBar from "@/components/SearchBar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Bosh sahifa", href: "/", icon: Home },
  { label: "Hublar", href: "/hubs", icon: Building2 },
  { label: "Darslar", href: "/classrooms", icon: GraduationCap },
  { label: "Laboratoriyalar", href: "/research-labs", icon: FlaskConical },
  { label: "Startaplar", href: "/startups", icon: Rocket },
  { label: "Investorlar", href: "/investors", icon: Users },
  { label: "Tadbirlar", href: "/events", icon: Calendar },
  { label: "ALSA", href: "/ai-chat", icon: Sparkles },
];

const userNavItems = [
  { label: "Profil", href: "/profile", icon: User },
  { label: "Xabarlar", href: "/messages", icon: MessageCircle },
  { label: "Sozlamalar", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  const isActiveLink = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Fetch unread notifications and profile
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setProfile(null);
      return;
    }

    const fetchData = async () => {
      const [notifRes, profileRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false),
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .single()
      ]);
      
      setUnreadCount(notifRes.count || 0);
      if (profileRes.data) setProfile(profileRes.data);
    };

    fetchData();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`sidebar-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };


  const NavItem = ({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) => {
    const NavIcon = item.icon;
    
    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-sidebar-primary/15 text-sidebar-primary" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <NavIcon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden md:flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 h-16 px-4 border-b border-sidebar-border shrink-0",
        collapsed && "justify-center px-2"
      )}>
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={alsamosLogo} 
            alt="Alsamos Logo" 
            className="w-8 h-8 group-hover:scale-105 transition-transform duration-200"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-base leading-tight text-sidebar-foreground">Alsamos</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider">VALLEY</span>
            </div>
          )}
        </Link>
      </div>

      {/* Search - Only when expanded */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <SearchBar />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Main nav */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} isActive={isActiveLink(item.href)} />
          ))}
        </div>

        {/* User-specific navigation */}
        {user && (
          <div className={cn("mt-6 pt-4 border-t border-sidebar-border space-y-1")}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Shaxsiy
              </p>
            )}
            {userNavItems.map((item) => (
              <NavItem key={item.href} item={item} isActive={isActiveLink(item.href)} />
            ))}
            
            {/* Notifications link */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to="/notifications"
                    className={cn(
                      "relative flex items-center justify-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActiveLink('/notifications')
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Bell className="w-5 h-5 shrink-0" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Bildirishnomalar {unreadCount > 0 && `(${unreadCount})`}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/notifications"
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActiveLink('/notifications')
                    ? "bg-sidebar-primary/15 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Bell className="w-5 h-5 shrink-0" />
                <span>Bildirishnomalar</span>
                {unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className={cn(
        "shrink-0 border-t border-sidebar-border p-3",
        collapsed && "p-2"
      )}>
        {user ? (
          <div className={cn("space-y-3", collapsed && "flex flex-col items-center")}>
            {/* User profile mini */}
            {!collapsed && profile && (
              <Link to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-sidebar-accent transition-colors">
                <Avatar className="w-9 h-9 border-2 border-sidebar-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile.full_name || "Foydalanuvchi"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Profilni ko'rish</p>
                </div>
              </Link>
            )}
            
            {/* Create room button */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to="/create-room">
                    <Button variant="default" size="icon" className="w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Xona yaratish
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link to="/create-room" className="block">
                <Button className="w-full gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                  <Plus className="w-4 h-4" />
                  Xona yaratish
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to="/auth">
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl">
                      <LogIn className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Kirish
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full">
                  Kirish
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
};

export default Sidebar;
