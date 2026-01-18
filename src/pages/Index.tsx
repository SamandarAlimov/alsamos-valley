import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HubsSection from "@/components/home/HubsSection";
import StartupsSection from "@/components/home/StartupsSection";
import MetricsSection from "@/components/home/MetricsSection";
import AISection from "@/components/home/AISection";
import CTASection from "@/components/home/CTASection";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Rocket, Users, Building2, Calendar, TrendingUp, 
  Sparkles, ArrowRight, Plus, GraduationCap, FlaskConical,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  hub: string;
  member_count: number;
}

interface Startup {
  id: string;
  name: string;
  stage: string;
  ai_score: number | null;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

// Authenticated user home content
const AuthenticatedHome = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    roomsCount: 0,
    startupsCount: 0,
    eventsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 80;

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [roomsRes, startupsRes, eventsRes, myRoomsRes] = await Promise.all([
      supabase.from("room_members").select("room_id").eq("user_id", user.id),
      supabase.from("startups").select("*").eq("owner_id", user.id).limit(3),
      supabase.from("events").select("*").order("event_date", { ascending: true }).limit(4),
      supabase.from("rooms").select("*").limit(4),
    ]);

    // Get room details for user's rooms
    if (roomsRes.data && roomsRes.data.length > 0) {
      const roomIds = roomsRes.data.map(r => r.room_id);
      const { data: roomDetails } = await supabase
        .from("rooms")
        .select("*")
        .in("id", roomIds)
        .limit(4);
      if (roomDetails) setRooms(roomDetails);
    } else if (myRoomsRes.data) {
      setRooms(myRoomsRes.data);
    }

    if (startupsRes.data) setStartups(startupsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);

    // Get counts
    const [totalRooms, totalStartups] = await Promise.all([
      supabase.from("room_members").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("startups").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    ]);

    setStats({
      roomsCount: totalRooms.count || 0,
      startupsCount: totalStartups.count || 0,
      eventsCount: eventsRes.data?.length || 0,
    });
  }, [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPullingRef.current || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startYRef.current) * 0.5);
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      await handleRefresh();
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, handleRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="py-8 relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300 z-10",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{ top: Math.min(pullDistance - 40, 20) }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center",
          refreshing && "animate-pulse"
        )}>
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-primary transition-transform",
              refreshing && "animate-spin"
            )} 
            style={{ 
              transform: refreshing ? undefined : `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)` 
            }}
          />
        </div>
      </div>

      <div 
        className="section-container transition-transform duration-200"
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Xush kelibsiz, {user?.user_metadata?.full_name || "Innovator"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Bugun qanday innovatsiyalar yaratamiz?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.roomsCount}</p>
            <p className="text-xs text-muted-foreground">Xonalar</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Rocket className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.startupsCount}</p>
            <p className="text-xs text-muted-foreground">Startaplar</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.eventsCount}</p>
            <p className="text-xs text-muted-foreground">Tadbirlar</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link to="/create-room" className="glass-card p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">Xona yaratish</span>
          </Link>
          <Link to="/submit-startup" className="glass-card p-4 flex flex-col items-center gap-2 hover:border-accent/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium">Startap qo'shish</span>
          </Link>
          <Link to="/classrooms" className="glass-card p-4 flex flex-col items-center gap-2 hover:border-green-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm font-medium">Darslar</span>
          </Link>
          <Link to="/research-labs" className="glass-card p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm font-medium">Laboratoriyalar</span>
          </Link>
        </div>

        {/* Recent Rooms */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              So'nggi xonalar
            </h2>
            <Link to="/hubs" className="text-primary text-sm flex items-center gap-1 hover:underline">
              Barchasi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">Hali xonalar yo'q</p>
              <Link to="/create-room">
                <Button variant="hero" size="sm">Birinchi xonani yarating</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <Link key={room.id} to={`/rooms/${room.id}`}>
                  <div className="glass-card p-4 hover:border-primary/30 transition-all">
                    <h3 className="font-medium text-foreground">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">{room.hub} Hub • {room.member_count || 0} a'zo</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Yaqinlashayotgan tadbirlar
            </h2>
            <Link to="/events" className="text-primary text-sm flex items-center gap-1 hover:underline">
              Barchasi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Hozircha tadbirlar yo'q</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {events.map((event) => (
                <Link key={event.id} to="/events">
                  <div className="glass-card p-4 hover:border-green-500/30 transition-all">
                    <h3 className="font-medium text-foreground">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString("uz-UZ")}
                      </span>
                      {event.location && (
                        <span className="text-xs text-muted-foreground">• {event.location}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* AI Recommendations */}
        <section className="glass-card p-6 border border-accent/20">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            AI tavsiyalari
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <TrendingUp className="w-5 h-5 text-accent mb-2" />
              <h3 className="font-medium text-sm">Investorlar bilan bog'laning</h3>
              <p className="text-xs text-muted-foreground mt-1">3 ta investor sizning sohangizga qiziqadi</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <GraduationCap className="w-5 h-5 text-accent mb-2" />
              <h3 className="font-medium text-sm">O'quv kurslariga qo'shiling</h3>
              <p className="text-xs text-muted-foreground mt-1">5 ta bepul kurs mavjud</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <FlaskConical className="w-5 h-5 text-accent mb-2" />
              <h3 className="font-medium text-sm">Laboratoriyalarga qo'shiling</h3>
              <p className="text-xs text-muted-foreground mt-1">Tadqiqotchilar jamoasiga qo'shiling</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Public landing page content
const PublicHome = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HubsSection />
      <StartupsSection />
      <AISection />
      <MetricsSection />
      <CTASection />
      <Footer />
    </>
  );
};

const Index = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      {user ? <AuthenticatedHome /> : <PublicHome />}
    </AppLayout>
  );
};

export default Index;