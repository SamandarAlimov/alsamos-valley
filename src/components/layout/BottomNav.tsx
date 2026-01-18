import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Building2, 
  Rocket, 
  Plus,
  User,
  Search
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isActiveLink = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`bottom-nav-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const NavItem = ({ 
    to, 
    icon: Icon, 
    label, 
    isActive,
    badge = 0
  }: { 
    to: string; 
    icon: React.ElementType; 
    label: string; 
    isActive: boolean;
    badge?: number;
  }) => (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all duration-300 relative",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground active:scale-95"
      )}
    >
      {/* Active indicator */}
      <div className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300",
        isActive ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-transparent"
      )} />
      
      {/* Icon with glow effect when active */}
      <div className={cn(
        "relative transition-transform duration-300",
        isActive && "scale-110"
      )}>
        <Icon className={cn(
          "w-5 h-5 transition-all duration-300",
          isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
        )} />
        {/* Notification badge */}
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-[0_0_8px_hsl(var(--destructive)/0.5)]">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-[10px] font-medium transition-all duration-300",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <NavItem 
          to="/" 
          icon={Home} 
          label="Bosh" 
          isActive={isActiveLink('/')} 
        />

        {/* Hublar */}
        <NavItem 
          to="/hubs" 
          icon={Building2} 
          label="Hublar" 
          isActive={isActiveLink('/hubs')} 
        />

        {/* Center - Create / Search */}
        <div className="flex items-center gap-1">
          {/* Search Sheet */}
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 w-10 h-10 rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95">
                <Search className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl">
              <div className="pt-4 pb-8 px-2">
                <h3 className="text-lg font-semibold mb-4">Qidiruv</h3>
                <SearchBar />
              </div>
            </SheetContent>
          </Sheet>

          {/* Create Button with glow */}
          <Link
            to={user ? "/create-room" : "/auth"}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
              "bg-gradient-to-br from-primary to-accent text-primary-foreground",
              "shadow-[0_4px_20px_hsl(var(--primary)/0.4)]",
              "hover:shadow-[0_4px_30px_hsl(var(--primary)/0.6)]",
              "active:scale-95 active:shadow-[0_2px_10px_hsl(var(--primary)/0.3)]"
            )}
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>

        {/* Startaplar */}
        <NavItem 
          to="/startups" 
          icon={Rocket} 
          label="Startaplar" 
          isActive={isActiveLink('/startups')} 
        />

        {/* Profile / Auth with notification badge */}
        {user ? (
          <NavItem 
            to="/profile" 
            icon={User} 
            label="Profil" 
            isActive={isActiveLink('/profile')}
            badge={unreadCount}
          />
        ) : (
          <NavItem 
            to="/auth" 
            icon={User} 
            label="Kirish" 
            isActive={isActiveLink('/auth')} 
          />
        )}
      </div>
    </nav>
  );
};

export default BottomNav;