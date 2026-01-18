import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Users,
  Target,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Sparkles,
  Mail,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Startup {
  id: string;
  name: string;
  description: string;
  problem: string;
  solution: string;
  stage: string;
  funding_needed: number;
  funding_raised: number;
  mvp_status: string;
  traction: any;
  team: any;
  pitch_deck_url: string;
  ai_score: number;
  hub: string;
  created_at: string;
}

const StartupProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setStartup(data);
      }
      setLoading(false);
    };

    fetchStartup();
  }, [id]);

  // Mock data for demonstration
  const mockStartup: Startup = {
    id: id || "1",
    name: "EcoTrack AI",
    description: "AI-powered sustainability tracking platform that helps businesses monitor and reduce their carbon footprint through real-time analytics and actionable insights.",
    problem: "Businesses struggle to accurately track and reduce their environmental impact due to fragmented data sources, complex calculations, and lack of actionable insights.",
    solution: "EcoTrack AI aggregates environmental data from multiple sources, uses machine learning to identify patterns and opportunities, and provides personalized recommendations for reducing carbon emissions.",
    stage: "growth",
    funding_needed: 500000,
    funding_raised: 150000,
    mvp_status: "launched",
    traction: {
      users: 1250,
      revenue: 45000,
      growth: 25,
    },
    team: [
      { name: "Alex Chen", role: "CEO & Founder", avatar: "AC" },
      { name: "Sarah Kim", role: "CTO", avatar: "SK" },
      { name: "Mike Johnson", role: "Head of Product", avatar: "MJ" },
      { name: "Emily Davis", role: "Lead Engineer", avatar: "ED" },
    ],
    pitch_deck_url: "#",
    ai_score: 87,
    hub: "tech",
    created_at: "2024-01-15",
  };

  const displayStartup = startup || mockStartup;

  const fundingProgress = (displayStartup.funding_raised / displayStartup.funding_needed) * 100;

  const getMvpStatusColor = (status: string) => {
    switch (status) {
      case "launched": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "beta": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "development": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default: return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const getMvpStatusIcon = (status: string) => {
    switch (status) {
      case "launched": return CheckCircle;
      case "beta": return Clock;
      case "development": return AlertCircle;
      default: return Clock;
    }
  };

  const MvpIcon = getMvpStatusIcon(displayStartup.mvp_status);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading startup...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <main className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link to="/startups" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Startups
          </Link>

          {/* Header */}
          <div className="glass-card p-8 rounded-2xl mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-display font-bold text-foreground">{displayStartup.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getMvpStatusColor(displayStartup.mvp_status)}`}>
                      <MvpIcon className="w-3 h-3 inline mr-1" />
                      {displayStartup.mvp_status}
                    </span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{displayStartup.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Founded {new Date(displayStartup.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">{displayStartup.hub} Hub</span>
                    <span className="text-sm text-muted-foreground capitalize">{displayStartup.stage} Stage</span>
                  </div>
                </div>
              </div>

              {/* AI Score */}
              <div className="flex flex-col items-center p-6 bg-accent/10 rounded-xl border border-accent/20">
                <Sparkles className="w-6 h-6 text-accent mb-2" />
                <span className="text-4xl font-bold text-accent">{displayStartup.ai_score}</span>
                <span className="text-sm text-muted-foreground">AI Score</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Problem & Solution */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-foreground">The Problem</h2>
                  </div>
                  <p className="text-muted-foreground">{displayStartup.problem}</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-foreground">The Solution</h2>
                  </div>
                  <p className="text-muted-foreground">{displayStartup.solution}</p>
                </div>
              </div>

              {/* Traction & KPIs */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-foreground">Traction & KPIs</h2>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-3xl font-bold text-foreground">{displayStartup.traction?.users?.toLocaleString() || "1,250"}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-3xl font-bold text-foreground">${(displayStartup.traction?.revenue || 45000).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-400">+{displayStartup.traction?.growth || 25}%</p>
                    <p className="text-sm text-muted-foreground">MoM Growth</p>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Founders & Team</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Array.isArray(displayStartup.team) ? displayStartup.team : mockStartup.team).map((member: any, index: number) => (
                    <div key={index} className="text-center p-4 bg-card/50 rounded-lg">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg mb-3">
                        {member.avatar || member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <p className="font-medium text-foreground text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pitch Deck */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold text-foreground">Pitch Deck</h2>
                  </div>
                  <Button variant="glass" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Full Deck
                  </Button>
                </div>
                <div className="aspect-video bg-card/50 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Pitch deck preview</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Funding Progress */}
              <div className="glass-card p-6 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Funding</h2>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="text-foreground font-medium">${displayStartup.funding_raised?.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-card rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="text-foreground font-medium">${displayStartup.funding_needed?.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{fundingProgress.toFixed(0)}% of goal reached</p>
                <Button variant="hero" className="w-full">
                  Invest Now
                </Button>
              </div>

              {/* CTA Buttons */}
              <div className="glass-card p-6 rounded-xl space-y-3">
                <Button variant="glass" className="w-full gap-2">
                  <Target className="w-4 h-4" />
                  Support Project
                </Button>
                <Button variant="glass" className="w-full gap-2">
                  <Users className="w-4 h-4" />
                  Join Team
                </Button>
              </div>

              {/* Investor Contact */}
              <div className="glass-card p-6 rounded-xl border border-accent/20">
                <h3 className="font-semibold text-foreground mb-4">Investor Contact</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Interested in investing or learning more? Reach out directly to the founders.
                </p>
                <Button variant="glass" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Founders
                </Button>
              </div>

              {/* Roadmap Preview */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="font-semibold text-foreground mb-4">Roadmap</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Q1 2024: MVP Launch</p>
                      <p className="text-xs text-green-400">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Q2 2024: Series A</p>
                      <p className="text-xs text-yellow-400">In Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Q3 2024: Global Expansion</p>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default StartupProfile;
