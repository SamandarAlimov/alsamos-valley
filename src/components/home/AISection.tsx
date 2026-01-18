import { Bot, Lightbulb, Calculator, Users, Map, AlertTriangle, FileText, TrendingUp, GitMerge, Sparkles } from "lucide-react";

const aiCapabilities = [
  { icon: Lightbulb, label: "Idea Analysis", description: "Evaluate and refine your concepts" },
  { icon: Calculator, label: "Budget Calculation", description: "Smart financial projections" },
  { icon: Users, label: "Team Matchmaking", description: "Find perfect co-founders" },
  { icon: Map, label: "Roadmap Creation", description: "Strategic milestone planning" },
  { icon: AlertTriangle, label: "Risk Detection", description: "Identify potential challenges" },
  { icon: FileText, label: "Weekly Summaries", description: "Progress reports & insights" },
  { icon: TrendingUp, label: "Startup Scoring", description: "AI-powered evaluation" },
  { icon: GitMerge, label: "Room Merging", description: "Combine similar projects" },
];

const AISection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-cyber-blue/10 via-neon-purple/5 to-transparent" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered</span>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
              Your AI <span className="text-gradient">Chief Operating Officer</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Our advanced AI acts as the backbone of Alsamos Valley, managing workflows, 
              analyzing projects, and providing intelligent recommendations across the entire ecosystem.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {aiCapabilities.map((cap) => (
                <div key={cap.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center shrink-0">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{cap.label}</h4>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="glass-card p-8 lg:p-10">
              {/* AI Interface Mock */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center animate-pulse-glow">
                  <Bot className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">Valley AI</h3>
                  <p className="text-sm text-primary">Analyzing your project...</p>
                </div>
              </div>

              {/* Sample AI Output */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Startup Score</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl text-gradient">87</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground block mb-1">Market Fit</span>
                    <div className="w-full h-2 rounded-full bg-secondary">
                      <div className="w-[78%] h-full rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple" />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground block mb-1">Team Strength</span>
                    <div className="w-full h-2 rounded-full bg-secondary">
                      <div className="w-[92%] h-full rounded-full bg-gradient-to-r from-cyber-blue to-neon-purple" />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="text-primary font-medium">Recommendation:</span> Consider adding a marketing specialist to accelerate user acquisition.
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyber-blue/20 to-neon-purple/20 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
