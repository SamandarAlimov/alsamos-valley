import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Cpu, Briefcase, GraduationCap, Palette, Heart, TrendingUp, 
  Users, Layers, Search, FlaskConical, Stethoscope, Atom, Building2, Leaf, Rocket,
  BookOpen, Beaker, Microscope
} from "lucide-react";

interface HubStats {
  [key: string]: { rooms: number; members: number };
}

const hubsData = [
  // Ilmiy va Texnologiya
  {
    id: "tech",
    icon: Cpu,
    name: "Texnologiya Hub",
    description: "Dasturiy ta'minot, sun'iy intellekt, apparat innovatsiyalari, blokcheyn va chuqur texnologiya loyihalari.",
    color: "from-blue-500 to-cyan-400",
    category: "science",
  },
  {
    id: "science",
    icon: FlaskConical,
    name: "Ilmiy Tadqiqot Hub",
    description: "Kimyo, fizika, biologiya va boshqa ilmiy sohalar bo'yicha tadqiqotlar va eksperimentlar.",
    color: "from-purple-500 to-indigo-400",
    category: "science",
  },
  {
    id: "medicine",
    icon: Stethoscope,
    name: "Tibbiyot Hub",
    description: "Tibbiy tadqiqotlar, farmatsevtika, biotexnologiya va sog'liqni saqlash innovatsiyalari.",
    color: "from-red-500 to-pink-400",
    category: "science",
  },
  {
    id: "engineering",
    icon: Atom,
    name: "Muhandislik Hub",
    description: "Mexanika, elektrotexnika, robotika va qurilish loyihalari.",
    color: "from-orange-500 to-amber-400",
    category: "science",
  },
  // Ta'lim
  {
    id: "education",
    icon: GraduationCap,
    name: "Ta'lim Hub",
    description: "EdTech platformalari, o'quv boshqaruv tizimlari, malaka oshirish va ta'lim transformatsiyasi.",
    color: "from-violet-500 to-purple-400",
    category: "education",
  },
  {
    id: "courses",
    icon: BookOpen,
    name: "Kurslar Hub",
    description: "Online kurslar, sertifikat dasturlari va professional rivojlanish.",
    color: "from-teal-500 to-cyan-400",
    category: "education",
  },
  {
    id: "research",
    icon: Microscope,
    name: "Akademik Hub",
    description: "Ilmiy maqolalar, dissertatsiyalar va akademik hamkorlik.",
    color: "from-indigo-500 to-blue-400",
    category: "education",
  },
  // Biznes
  {
    id: "business",
    icon: Briefcase,
    name: "Biznes Hub",
    description: "Biznes modellari, bozorga chiqish strategiyalari va korxonalarni kengaytirish.",
    color: "from-emerald-500 to-teal-400",
    category: "business",
  },
  {
    id: "investment",
    icon: TrendingUp,
    name: "Investitsiya Hub",
    description: "Investor tarmoqlari, moliyalashtirish imkoniyatlari va moliyaviy o'sish strategiyalari.",
    color: "from-cyber-blue to-neon-purple",
    category: "business",
  },
  {
    id: "startup",
    icon: Rocket,
    name: "Startaplar Hub",
    description: "Yangi g'oyalar, startap akseleratorlari va tadbirkorlik dasturlari.",
    color: "from-yellow-500 to-orange-400",
    category: "business",
  },
  {
    id: "realestate",
    icon: Building2,
    name: "Ko'chmas Mulk Hub",
    description: "Qurilish, arxitektura va ko'chmas mulk loyihalari.",
    color: "from-slate-500 to-gray-400",
    category: "business",
  },
  // Ijodiy va Ijtimoiy
  {
    id: "creative",
    icon: Palette,
    name: "Ijodiy Hub",
    description: "Dizayn studiyalari, media ishlab chiqarish, kontent yaratish va o'yin sanoati.",
    color: "from-pink-500 to-rose-400",
    category: "creative",
  },
  {
    id: "sustainability",
    icon: Leaf,
    name: "Ekologiya Hub",
    description: "Barqaror rivojlanish, yashil texnologiyalar va atrof-muhit muhofazasi.",
    color: "from-green-500 to-emerald-400",
    category: "creative",
  },
  {
    id: "social-impact",
    icon: Heart,
    name: "Ijtimoiy Ta'sir Hub",
    description: "Barqarorlik tashabbuslari, sog'liqni saqlash yechimlari va jamiyat rivojlanishi.",
    color: "from-rose-500 to-red-400",
    category: "creative",
  },
];

const categories = [
  { id: "all", name: "Barchasi" },
  { id: "science", name: "Ilm-fan" },
  { id: "education", name: "Ta'lim" },
  { id: "business", name: "Biznes" },
  { id: "creative", name: "Ijodiy" },
];

const Hubs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hubStats, setHubStats] = useState<HubStats>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchHubStats = async () => {
      try {
        const { data: rooms } = await supabase.from("rooms").select("hub");
        const { data: members } = await supabase
          .from("room_members")
          .select("room_id, rooms(hub)")
          .not("rooms", "is", null);

        const stats: HubStats = {};
        
        hubsData.forEach(hub => {
          const hubRooms = rooms?.filter(r => r.hub?.toLowerCase() === hub.id.toLowerCase()) || [];
          const hubMembers = members?.filter(m => (m.rooms as unknown as { hub: string })?.hub?.toLowerCase() === hub.id.toLowerCase()) || [];
          
          stats[hub.id] = {
            rooms: hubRooms.length,
            members: hubMembers.length,
          };
        });

        setHubStats(stats);
      } catch (error) {
        console.error("Error fetching hub stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHubStats();
  }, []);

  const filteredHubs = hubsData.filter(hub => {
    const matchesSearch = hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || hub.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <main>
        <section className="relative py-8 sm:py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <h1 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 sm:mb-6">
                Innovatsiya <span className="text-gradient">Hublari</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8">
                Soha va mutaxassislik bo'yicha tashkil etilgan ixtisoslashgan jamoalarni o'rganing. 
                Har bir hubda g'oyalar haqiqatga aylanadigan xonalar mavjud.
              </p>
              
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Hublarni qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-border/50 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-3 sm:py-4 lg:py-6 border-b border-border/50 sticky top-14 md:top-0 bg-background/80 backdrop-blur-xl z-30">
          <div className="section-container">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 lg:py-16">
          <div className="section-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredHubs.map((hub) => {
                const stats = hubStats[hub.id] || { rooms: 0, members: 0 };
                
                return (
                  <Link
                    key={hub.id}
                    to={`/hubs/${hub.id}`}
                    className="glass-card p-4 sm:p-5 lg:p-6 group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${hub.color} flex items-center justify-center mb-3 sm:mb-4 lg:mb-5 group-hover:scale-110 transition-transform`}>
                      <hub.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-foreground" />
                    </div>
                    
                    <h2 className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground mb-1.5 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {hub.name}
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 lg:mb-5 line-clamp-2">
                      {hub.description}
                    </p>

                    <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 lg:pt-5 border-t border-border/50">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {loading ? "..." : stats.rooms}
                          </span> <span className="hidden sm:inline">Xonalar</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {loading ? "..." : stats.members}
                          </span> <span className="hidden sm:inline">A'zolar</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-4 lg:mt-5 text-primary font-medium text-xs sm:text-sm group-hover:gap-3 transition-all">
                      Hubni o'rganing
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredHubs.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <p className="text-sm sm:text-base text-muted-foreground">Qidiruv natijasida hub topilmadi.</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-8 sm:py-12 lg:py-24">
          <div className="section-container">
            <div className="glass-card p-5 sm:p-8 lg:p-12 text-center">
              <h2 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-foreground mb-3 sm:mb-4">
                Kerakli hubni topa olmadingizmi?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-xl mx-auto">
                Mavjud hubda xona yarating yoki yangi soha kategoriyasini taklif qiling.
              </p>
              <Link to="/create-room">
                <Button variant="hero" size="default" className="sm:size-lg">
                  Xona Yaratish
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Hubs;
