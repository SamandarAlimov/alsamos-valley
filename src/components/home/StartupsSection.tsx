import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Star } from "lucide-react";

const startups = [
  {
    name: "NexaTech AI",
    tagline: "AI-powered logistics optimization",
    category: "Tech",
    stage: "Series A",
    raised: "$2.5M",
    team: 12,
    score: 94,
    trending: true,
  },
  {
    name: "EduSphere",
    tagline: "Personalized learning for K-12",
    category: "Education",
    stage: "Seed",
    raised: "$500K",
    team: 6,
    score: 88,
    trending: true,
  },
  {
    name: "GreenHarvest",
    tagline: "Sustainable farming solutions",
    category: "Social Impact",
    stage: "Pre-Seed",
    raised: "$150K",
    team: 4,
    score: 82,
    trending: false,
  },
  {
    name: "FinFlow",
    tagline: "Digital payments for SMEs",
    category: "Business",
    stage: "Seed",
    raised: "$800K",
    team: 8,
    score: 91,
    trending: true,
  },
  {
    name: "MedAssist",
    tagline: "AI diagnostics platform",
    category: "Tech",
    stage: "Series A",
    raised: "$1.2M",
    team: 10,
    score: 89,
    trending: false,
  },
  {
    name: "CreativeStudio",
    tagline: "Collaborative design tools",
    category: "Creative",
    stage: "Seed",
    raised: "$350K",
    team: 5,
    score: 85,
    trending: false,
  },
];

const StartupsSection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Trending Now</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Featured <span className="text-gradient">Startups</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover the most promising startups building the future. 
              Each project is scored by our AI based on traction, team, and potential.
            </p>
          </div>
          <Button variant="outline" size="lg" className="shrink-0 group">
            View All Startups
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((startup) => (
            <div key={startup.name} className="startup-card group">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-primary text-lg">
                      {startup.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                        {startup.name}
                        {startup.trending && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            Trending
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{startup.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                    {startup.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                    {startup.stage}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="font-display font-bold text-foreground">{startup.raised}</div>
                    <div className="text-xs text-muted-foreground">Raised</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{startup.team}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold text-primary">{startup.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StartupsSection;
