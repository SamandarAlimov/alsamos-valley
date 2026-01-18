import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, Upload, Sparkles, TrendingUp, Shield, Lightbulb, 
  Target, DollarSign, Users, ArrowRight, CheckCircle2, Loader2
} from "lucide-react";

const stages = ["idea", "validation", "mvp", "growth", "scale"];
const mvpStatuses = ["planning", "building", "launched", "iterating"];
const hubs = ["Tech", "Business", "Education", "Creative", "Social Impact", "Investment"];

interface AIAnalysis {
  ai_score: number;
  analysis: {
    market_potential: number;
    team_execution: number;
    innovation_level: number;
    competitive_advantage: number;
    scalability: number;
  };
  strengths: string[];
  risks: string[];
  recommendations: string[];
  summary: string;
}

const SubmitStartup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    problem: "",
    solution: "",
    stage: "idea",
    mvp_status: "planning",
    hub: "Tech",
    funding_needed: "",
    team_size: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const analyzeStartup = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-startup", {
        body: {
          name: formData.name,
          description: formData.description,
          problem: formData.problem,
          solution: formData.solution,
          stage: formData.stage,
          funding_needed: formData.funding_needed ? parseFloat(formData.funding_needed) : null,
          mvp_status: formData.mvp_status,
        },
      });

      if (error) throw error;
      setAnalysis(data);
      setStep(3);
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze startup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const submitStartup = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from("startups").insert({
        name: formData.name,
        description: formData.description,
        problem: formData.problem,
        solution: formData.solution,
        stage: formData.stage,
        mvp_status: formData.mvp_status,
        hub: formData.hub,
        funding_needed: formData.funding_needed ? parseFloat(formData.funding_needed) : null,
        ai_score: analysis?.ai_score || null,
        owner_id: user.id,
        team: { size: formData.team_size ? parseInt(formData.team_size) : 1 },
      }).select().single();

      if (error) throw error;

      toast({
        title: "Startup Submitted!",
        description: "Your startup has been registered with ALSA scoring.",
      });
      
      navigate(`/startup/${data.id}`);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit startup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <main>
        {/* Hero */}
        <section className="relative py-12 lg:py-16 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Scoring by ALSA</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
                Submit Your <span className="text-gradient">Startup</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Get instant AI analysis, scoring, and connect with investors in the Alsamos Valley ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Progress Steps */}
        <section className="py-6 border-b border-border/50">
          <div className="section-container">
            <div className="flex items-center justify-center gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold transition-all ${
                    step >= s 
                      ? "bg-gradient-to-br from-cyber-blue to-neon-purple text-white" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span className={`hidden sm:inline text-sm font-medium ${
                    step >= s ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {s === 1 ? "Basic Info" : s === 2 ? "Details" : "AI Analysis"}
                  </span>
                  {s < 3 && <div className={`w-8 lg:w-16 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Content */}
        <section className="py-12 lg:py-16">
          <div className="section-container">
            <div className="max-w-2xl mx-auto">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="glass-card rounded-2xl p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-xl text-foreground">Basic Information</h2>
                      <p className="text-sm text-muted-foreground">Tell us about your startup</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Startup Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="e.g., TechNova AI"
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Brief description of your startup (2-3 sentences)"
                        rows={3}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Hub</label>
                        <select
                          value={formData.hub}
                          onChange={(e) => updateForm("hub", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary/50"
                        >
                          {hubs.map((hub) => (
                            <option key={hub} value={hub}>{hub}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Team Size</label>
                        <Input
                          type="number"
                          value={formData.team_size}
                          onChange={(e) => updateForm("team_size", e.target.value)}
                          placeholder="1"
                          min="1"
                          className="bg-secondary/50"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={() => setStep(2)} 
                      className="w-full"
                      variant="hero"
                      disabled={!formData.name || !formData.description}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="glass-card rounded-2xl p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-xl text-foreground">Problem & Solution</h2>
                      <p className="text-sm text-muted-foreground">What problem are you solving?</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Problem Statement</label>
                      <Textarea
                        value={formData.problem}
                        onChange={(e) => updateForm("problem", e.target.value)}
                        placeholder="What specific problem are you addressing? Who experiences this problem?"
                        rows={3}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Your Solution</label>
                      <Textarea
                        value={formData.solution}
                        onChange={(e) => updateForm("solution", e.target.value)}
                        placeholder="How does your product/service solve this problem? What makes it unique?"
                        rows={3}
                        className="bg-secondary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Stage</label>
                        <select
                          value={formData.stage}
                          onChange={(e) => updateForm("stage", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary/50"
                        >
                          {stages.map((stage) => (
                            <option key={stage} value={stage} className="capitalize">{stage}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">MVP Status</label>
                        <select
                          value={formData.mvp_status}
                          onChange={(e) => updateForm("mvp_status", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary/50"
                        >
                          {mvpStatuses.map((status) => (
                            <option key={status} value={status} className="capitalize">{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Funding Needed ($)</label>
                      <Input
                        type="number"
                        value={formData.funding_needed}
                        onChange={(e) => updateForm("funding_needed", e.target.value)}
                        placeholder="e.g., 500000"
                        className="bg-secondary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Pitch Deck (Optional)</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.pptx"
                          onChange={(e) => setPitchDeckFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="pitch-deck"
                        />
                        <label htmlFor="pitch-deck" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {pitchDeckFile ? pitchDeckFile.name : "Upload PDF or PPTX"}
                          </p>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={analyzeStartup} 
                        className="flex-1"
                        variant="hero"
                        disabled={analyzing || !formData.problem || !formData.solution}
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get ALSA Score
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: AI Analysis */}
              {step === 3 && analysis && (
                <div className="space-y-6 animate-fade-in">
                  {/* Score Card */}
                  <div className="glass-card rounded-2xl p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-semibold text-xl text-foreground">ALSA Score</h2>
                          <p className="text-sm text-muted-foreground">AI-powered startup analysis</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-5xl text-gradient">{analysis.ai_score}</div>
                        <div className="text-sm text-muted-foreground">out of 100</div>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6">{analysis.summary}</p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                      {Object.entries(analysis.analysis).map(([key, value]) => (
                        <div key={key} className="p-3 bg-secondary/50 rounded-xl text-center">
                          <div className="font-display font-bold text-2xl text-foreground">{value}</div>
                          <div className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Risks */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <h3 className="font-semibold text-foreground">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-yellow-400" />
                        <h3 className="font-semibold text-foreground">Risks</h3>
                      </div>
                      <ul className="space-y-2">
                        {analysis.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 mt-2" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">ALSA Recommendations</h3>
                    </div>
                    <ul className="grid md:grid-cols-3 gap-3">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back to Edit
                    </Button>
                    <Button 
                      onClick={submitStartup} 
                      className="flex-1"
                      variant="hero"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 mr-2" />
                          Submit Startup
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default SubmitStartup;
