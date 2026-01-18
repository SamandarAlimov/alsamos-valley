import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, DollarSign, ArrowRight, Shield, FileText, Video, Calendar, CheckCircle } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  company: string | null;
  bio: string | null;
  investment_focus: string[] | null;
  min_investment: number | null;
  max_investment: number | null;
  portfolio_count: number | null;
  is_verified: boolean | null;
  avatar_url: string | null;
}

interface Startup {
  id: string;
  name: string;
  hub: string | null;
  stage: string | null;
  funding_needed: number | null;
  ai_score: number | null;
}

interface PlatformStats {
  totalFunded: number;
  activeStartups: number;
  verifiedInvestors: number;
  successfulDeals: number;
}

const investmentProcess = [
  { step: 1, title: "Browse Deals", description: "Explore AI-curated investment opportunities" },
  { step: 2, title: "Due Diligence", description: "Access detailed data rooms and financials" },
  { step: 3, title: "Book Meeting", description: "Connect directly with founding teams" },
  { step: 4, title: "Invest", description: "Complete investment through our secure platform" },
];

const Investors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [featuredStartups, setFeaturedStartups] = useState<Startup[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalFunded: 0,
    activeStartups: 0,
    verifiedInvestors: 0,
    successfulDeals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investorsRes, startupsRes, startupsCountRes] = await Promise.all([
          supabase.from("investors").select("*").limit(10),
          supabase.from("startups").select("*").order("ai_score", { ascending: false }).limit(3),
          supabase.from("startups").select("id, funding_raised", { count: "exact" }),
        ]);

        if (investorsRes.data) setInvestors(investorsRes.data);
        if (startupsRes.data) setFeaturedStartups(startupsRes.data);

        const totalFunded = startupsCountRes.data?.reduce((sum, s) => sum + (s.funding_raised || 0), 0) || 0;
        const verifiedInvestors = investorsRes.data?.filter(i => i.is_verified).length || 0;

        setStats({
          totalFunded,
          activeStartups: startupsCountRes.count || 0,
          verifiedInvestors,
          successfulDeals: Math.floor((startupsCountRes.count || 0) * 0.15), // Estimate
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <AppLayout>
      <main>
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{formatAmount(stats.totalFunded)} Funded</span>
                </div>
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
                  Invest in <span className="text-gradient">Tomorrow's</span> Leaders
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Access vetted, AI-scored startups from Central Asia's most promising innovation ecosystem. 
                  Make data-driven investment decisions.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="hero" size="lg">
                    View All Deals
                  </Button>
                  <Button variant="hero-outline" size="lg">
                    <Calendar className="w-5 h-5" />
                    Book Demo Day
                  </Button>
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="font-display font-semibold text-xl text-foreground mb-6">Platform Overview</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="font-display font-bold text-3xl text-gradient mb-1">
                      {loading ? "..." : formatAmount(stats.totalFunded)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Funded</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-3xl text-foreground mb-1">
                      {loading ? "..." : stats.activeStartups}+
                    </div>
                    <div className="text-sm text-muted-foreground">Active Startups</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-3xl text-foreground mb-1">
                      {loading ? "..." : stats.verifiedInvestors}
                    </div>
                    <div className="text-sm text-muted-foreground">Verified Investors</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-3xl text-foreground mb-1">
                      {loading ? "..." : stats.successfulDeals}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful Deals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="section-container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-4">
                  Featured <span className="text-gradient">Deals</span>
                </h2>
                <p className="text-muted-foreground">AI-recommended investment opportunities</p>
              </div>
              <Button variant="outline" className="hidden lg:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {featuredStartups.map((startup) => (
                  <div key={startup.id} className="glass-card p-6 group hover:-translate-y-1 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-primary text-xl">
                        {startup.name.charAt(0)}
                      </div>
                      {startup.ai_score && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="font-bold text-primary">{startup.ai_score}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-display font-semibold text-xl text-foreground mb-1">{startup.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{startup.hub || "General"}</p>

                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                        {startup.hub || "Tech"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground capitalize">
                        {startup.stage || "Seed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-secondary/50">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Raising</div>
                        <div className="font-display font-bold text-foreground">
                          {startup.funding_needed ? formatAmount(startup.funding_needed) : "TBD"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Stage</div>
                        <div className="font-display font-bold text-foreground capitalize">
                          {startup.stage || "Seed"}
                        </div>
                      </div>
                    </div>

                    <Button variant="hero" size="sm" className="w-full">
                      View Deal
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Verified Investors */}
        {investors.length > 0 && (
          <section className="py-16 lg:py-24">
            <div className="section-container">
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-8">
                Verified <span className="text-gradient">Investors</span>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {investors.slice(0, 4).map((investor) => (
                  <div key={investor.id} className="glass-card p-5 group hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center font-display font-bold text-primary">
                        {investor.name.charAt(0)}
                      </div>
                      {investor.is_verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{investor.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{investor.company || "Angel Investor"}</p>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Focus: </span>
                      <span className="font-medium text-foreground">
                        {investor.investment_focus?.slice(0, 2).join(", ") || "Various"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 lg:py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-4">
                How It <span className="text-gradient">Works</span>
              </h2>
              <p className="text-muted-foreground">
                A streamlined investment process designed for modern investors
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {investmentProcess.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center mx-auto mb-4 font-display font-bold text-2xl text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="section-container">
            <div className="glass-card p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-4">
                    Ready to Invest in Innovation?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Join our network of verified investors and get early access to the most promising startups in Central Asia.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="hero" size="lg">
                      Become an Investor
                    </Button>
                    <Button variant="outline" size="lg">
                      <Video className="w-5 h-5" />
                      Watch Demo Day
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-center lg:justify-end">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">NDA Protected</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Full Due Diligence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Investors;
