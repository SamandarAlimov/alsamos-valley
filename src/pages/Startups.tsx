import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Users, Star, ArrowRight, DollarSign, Rocket } from "lucide-react";

interface Startup {
  id: string;
  name: string;
  description: string | null;
  hub: string | null;
  stage: string | null;
  funding_raised: number | null;
  ai_score: number | null;
  team: unknown;
}

const categories = ["All", "Tech", "Business", "Education", "Creative", "Social Impact"];
const stages = ["All Stages", "idea", "Pre-Seed", "Seed", "Series A", "Series B+"];

const Startups = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const { data, count, error } = await supabase
          .from("startups")
          .select("*", { count: "exact" })
          .order("ai_score", { ascending: false, nullsFirst: false })
          .limit(50);

        if (error) throw error;
        setStartups(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error("Error fetching startups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStartups();
  }, []);

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || startup.hub?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStage = selectedStage === "All Stages" || startup.stage === selectedStage;
    return matchesSearch && matchesCategory && matchesStage;
  });

  const getTeamSize = (team: unknown): number => {
    if (Array.isArray(team)) return team.length;
    return 0;
  };

  const formatFunding = (amount: number | null): string => {
    if (!amount) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <AppLayout>
      <main>
        <section className="relative py-8 sm:py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
                <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-primary">{totalCount}+ Faol Startaplar</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 sm:mb-6">
                <span className="text-gradient">Startaplarni</span> Kashf Qiling
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8">
                Kelajakni qurayotgan eng istiqbolli startaplarni o'rganing. 
                Har bir loyiha traction, jamoa kuchi va bozor potentsialiga asoslangan AI baholash oladi.
              </p>
              <Link to="/submit-startup">
                <Button variant="hero" size="default" className="sm:size-lg">
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Startap Yuborish
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-3 sm:py-4 lg:py-6 border-b border-border/50 sticky top-14 md:top-0 bg-background/90 backdrop-blur-xl z-20">
          <div className="section-container">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Startaplarni qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-2.5 rounded-lg bg-secondary/50 border border-border/50 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 lg:flex-none">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg bg-secondary/50 border border-border/50 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary/50 shrink-0"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 lg:py-16">
          <div className="section-container">
            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {filteredStartups.map((startup) => (
                  <Link 
                    key={startup.id} 
                    to={`/startups/${startup.id}`}
                    className="startup-card group"
                  >
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-primary text-sm sm:text-lg lg:text-xl shrink-0">
                            {startup.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display font-semibold text-sm sm:text-base lg:text-lg text-foreground flex items-center gap-1.5 sm:gap-2">
                              <span className="truncate">{startup.name}</span>
                              {startup.ai_score && startup.ai_score >= 85 && (
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                              )}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{startup.hub || "General"}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                        {startup.description || "Tavsif mavjud emas"}
                      </p>

                      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                        {startup.hub && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-secondary text-[10px] sm:text-xs font-medium text-muted-foreground">
                            {startup.hub}
                          </span>
                        )}
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-secondary text-[10px] sm:text-xs font-medium text-muted-foreground capitalize">
                          {startup.stage || "G'oya"}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm text-foreground">{formatFunding(startup.funding_raised)}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm text-muted-foreground">{getTeamSize(startup.team)}</span>
                        </div>
                      </div>
                      {startup.ai_score && (
                        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-primary/10">
                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          <span className="font-display font-bold text-xs sm:text-sm text-primary">{startup.ai_score}</span>
                        </div>
                      )}
                    </div>

                    <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-t border-border/50">
                      <Button variant="outline" className="w-full text-xs sm:text-sm group-hover:border-primary/50">
                        Batafsil
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && filteredStartups.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <p className="text-sm sm:text-base text-muted-foreground">Mezoningizga mos startaplar topilmadi.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Startups;
