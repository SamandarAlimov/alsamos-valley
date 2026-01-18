import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Cpu, Briefcase, GraduationCap, Palette, Heart, TrendingUp,
  Users, Layers, ArrowRight, Plus, Search, Star, Sparkles, User
} from "lucide-react";

const hubData: Record<string, { icon: any; name: string; description: string; color: string }> = {
  tech: { icon: Cpu, name: "Tech Hub", description: "Software development, AI/ML, hardware innovation, blockchain, and deep tech projects.", color: "from-blue-500 to-cyan-400" },
  business: { icon: Briefcase, name: "Business Hub", description: "Business models, go-to-market strategies, operations excellence.", color: "from-emerald-500 to-teal-400" },
  education: { icon: GraduationCap, name: "Education Hub", description: "EdTech platforms, learning management systems, skill development.", color: "from-violet-500 to-purple-400" },
  creative: { icon: Palette, name: "Creative Hub", description: "Design studios, media production, content creation, gaming.", color: "from-pink-500 to-rose-400" },
  "social-impact": { icon: Heart, name: "Social Impact Hub", description: "Sustainability, healthcare solutions, community development.", color: "from-orange-500 to-amber-400" },
  investment: { icon: TrendingUp, name: "Investment Hub", description: "Investor networks, funding opportunities, capital allocation.", color: "from-cyan-500 to-purple-500" },
};

interface Room {
  id: string;
  name: string;
  description: string;
  member_count: number;
  room_type: string;
  success_score: number | null;
}

interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  ai_score: number | null;
}

interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  avatar_url: string | null;
}

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const hub = hubData[hubId || "tech"] || hubData.tech;
  const HubIcon = hub.icon;

  useEffect(() => {
    const fetchData = async () => {
      const hubName = hub.name.replace(" Hub", "").toLowerCase();
      
      const [roomsRes, startupsRes, mentorsRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("hub", hubName).limit(12),
        supabase.from("startups").select("*").eq("hub", hubName).limit(6),
        supabase.from("mentors").select("*").contains("hubs", [hubName]).limit(4),
      ]);

      setRooms(roomsRes.data || []);
      setStartups(startupsRes.data || []);
      setMentors(mentorsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [hubId, hub.name]);

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <main>
        {/* Hero */}
        <section className="relative py-8 sm:py-12 lg:py-24 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="flex flex-col gap-6 lg:gap-8 items-center lg:flex-row">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl lg:rounded-3xl bg-gradient-to-br ${hub.color} flex items-center justify-center shrink-0`}>
                <HubIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-foreground mb-2 sm:mb-4">
                  {hub.name}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  {hub.description}
                </p>
              </div>
              <Link to="/create-room" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Create Room</span>
                  <span className="sm:hidden">Xona yaratish</span>
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-12">
              <div className="glass-card p-3 sm:p-4 lg:p-6 text-center">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary mx-auto mb-1 sm:mb-2" />
                <div className="font-display font-bold text-lg sm:text-xl lg:text-3xl text-foreground">{rooms.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Xonalar</div>
              </div>
              <div className="glass-card p-3 sm:p-4 lg:p-6 text-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary mx-auto mb-1 sm:mb-2" />
                <div className="font-display font-bold text-lg sm:text-xl lg:text-3xl text-foreground">{startups.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Startaplar</div>
              </div>
              <div className="glass-card p-3 sm:p-4 lg:p-6 text-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary mx-auto mb-1 sm:mb-2" />
                <div className="font-display font-bold text-lg sm:text-xl lg:text-3xl text-foreground">{mentors.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Mentorlar</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="py-3 sm:py-4 lg:py-6 border-b border-border/50 sticky top-14 md:top-0 bg-background/90 backdrop-blur-xl z-20">
          <div className="section-container">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Xonalarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-border/50 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="py-6 sm:py-8 lg:py-16">
          <div className="section-container">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h2 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-foreground">
                Innovatsion <span className="text-gradient">Xonalar</span>
              </h2>
            </div>

            {filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {filteredRooms.map((room) => (
                  <Link key={room.id} to={`/room/${room.id}`} className="glass-card p-4 sm:p-5 lg:p-6 group hover:-translate-y-1 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                      <h3 className="font-display font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {room.name}
                      </h3>
                      {room.success_score && (
                        <div className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-green-500/10 text-green-400 text-xs sm:text-sm shrink-0">
                          <Sparkles className="w-3 h-3" />
                          {room.success_score}%
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                      {room.description || "Hamkorlikdagi innovatsiya maydoni"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{room.member_count || 0} a'zo</span>
                      </div>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-secondary text-muted-foreground capitalize truncate max-w-[100px]">
                        {room.room_type?.replace("-", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16 glass-card rounded-xl sm:rounded-2xl">
                <Layers className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-2">Hali xonalar yo'q</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Ushbu hubda birinchi xonani yarating!</p>
                <Link to="/create-room">
                  <Button variant="hero" size="default" className="sm:size-lg">Xona yaratish</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured Startups */}
        {startups.length > 0 && (
          <section className="py-6 sm:py-8 lg:py-16 bg-gradient-to-b from-secondary/20 to-background">
            <div className="section-container">
              <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                <h2 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-foreground">
                  Taniqli <span className="text-gradient">Startaplar</span>
                </h2>
                <Link to="/startups" className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm sm:text-base">
                  <span className="hidden sm:inline">Barchasi</span> <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {startups.map((startup) => (
                  <Link key={startup.id} to={`/startup/${startup.id}`} className="glass-card p-4 sm:p-5 lg:p-6 group hover:-translate-y-1 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-primary text-sm sm:text-base">
                        {startup.name.charAt(0)}
                      </div>
                      {startup.ai_score && (
                        <div className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-primary/10 text-primary text-xs sm:text-sm shrink-0">
                          <Star className="w-3 h-3" />
                          {startup.ai_score}
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-1 line-clamp-1">{startup.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{startup.description}</p>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-secondary text-muted-foreground capitalize">
                      {startup.stage}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mentors */}
        {mentors.length > 0 && (
          <section className="py-6 sm:py-8 lg:py-16">
            <div className="section-container">
              <h2 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-foreground mb-4 sm:mb-6 lg:mb-8">
                Ekspert <span className="text-gradient">Mentorlar</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {mentors.map((mentor) => (
                  <div key={mentor.id} className="glass-card p-3 sm:p-4 lg:p-6 text-center group hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                      {mentor.avatar_url ? (
                        <img src={mentor.avatar_url} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-sm sm:text-base lg:text-lg text-foreground line-clamp-1">{mentor.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-1">{mentor.title}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {mentor.expertise?.slice(0, 2).map((skill, i) => (
                        <span key={i} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </AppLayout>
  );
};

export default HubDetail;
