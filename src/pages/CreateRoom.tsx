import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Users,
  Lock,
  FileCheck,
  UserPlus,
  Cpu,
  Briefcase,
  GraduationCap,
  Palette,
  Heart,
  TrendingUp,
  Target,
  AlertTriangle,
  DollarSign,
  Map,
} from "lucide-react";

const hubs = [
  { id: "tech", name: "Tech Hub", icon: Cpu, description: "Technology & Software" },
  { id: "business", name: "Business Hub", icon: Briefcase, description: "Business & Strategy" },
  { id: "education", name: "Education Hub", icon: GraduationCap, description: "Learning & Development" },
  { id: "creative", name: "Creative Hub", icon: Palette, description: "Design & Arts" },
  { id: "social", name: "Social Impact", icon: Heart, description: "Social & Environmental" },
  { id: "investment", name: "Investment Hub", icon: TrendingUp, description: "Funding & Investment" },
];

const roomTypes = [
  { id: "open", name: "Open Room", icon: Users, description: "Anyone can join freely" },
  { id: "test-entry", name: "Test-Entry Room", icon: FileCheck, description: "Pass a test to join" },
  { id: "selection", name: "Selection Room", icon: UserPlus, description: "Application-based entry" },
  { id: "invite-only", name: "Invite-Only Room", icon: Lock, description: "By invitation only" },
];

interface AIAnalysis {
  roadmap: { phase: string; tasks: string[] }[];
  teamSuggestions: string[];
  budgetEstimate: string;
  successScore: number;
  riskScore: number;
}

const CreateRoom = () => {
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [selectedHub, setSelectedHub] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalSteps = 6;

  const canProceed = () => {
    switch (step) {
      case 1: return roomName.trim().length >= 3;
      case 2: return selectedHub !== "";
      case 3: return description.trim().length >= 20;
      case 4: return roomType !== "";
      case 5: return aiAnalysis !== null;
      default: return true;
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-room", {
        body: { roomName, hub: selectedHub, description, roomType },
      });

      if (error) throw error;
      
      setAiAnalysis(data);
      setStep(6);
    } catch (error: any) {
      toast({ title: "AI Analysis Failed", description: error.message || "Using fallback analysis", variant: "destructive" });
      // Fallback
      setAiAnalysis({
        roadmap: [
          { phase: "Phase 1: Foundation", tasks: ["Define objectives", "Build team", "Set up workspace"] },
          { phase: "Phase 2: Development", tasks: ["Build MVP", "User research", "Iterate"] },
          { phase: "Phase 3: Growth", tasks: ["Launch", "Scale", "Seek funding"] },
        ],
        teamSuggestions: ["Developer", "Product Manager", "Designer", "Marketing"],
        budgetEstimate: "$10,000 - $50,000",
        successScore: 75,
        riskScore: 35,
      });
      setStep(6);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a room", variant: "destructive" });
      return;
    }

    setCreating(true);

    try {
      // Map room type to privacy setting
      const privacyMap: Record<string, string> = {
        "open": "public",
        "test-entry": "private",
        "selection": "private",
        "invite-only": "invite-only",
      };
      
      const { data, error } = await supabase.from("rooms").insert({
        name: roomName,
        hub: selectedHub,
        description,
        room_type: roomType,
        privacy: privacyMap[roomType] || "public",
        require_approval: roomType === "selection" || roomType === "test-entry",
        owner_id: user.id,
        roadmap: aiAnalysis?.roadmap,
        budget_estimate: parseFloat(aiAnalysis?.budgetEstimate?.replace(/[^0-9.-]+/g, "") || "0"),
        success_score: aiAnalysis?.successScore,
        risk_score: aiAnalysis?.riskScore,
      }).select().single();

      if (error) throw error;

      // Add creator as room member
      await supabase.from("room_members").insert({
        room_id: data.id,
        user_id: user.id,
        role: "owner",
      });

      toast({ title: "Room Created!", description: "Your innovation room is ready." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <main className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-sm text-primary">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Room Name */}
          {step === 1 && (
            <div className="glass-card p-8 rounded-2xl animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Name Your Room</h1>
                <p className="text-muted-foreground">Give your innovation space a memorable name</p>
              </div>
              <div className="space-y-4">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="e.g., AI for Healthcare"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="text-lg py-6"
                />
                <p className="text-sm text-muted-foreground">Minimum 3 characters</p>
              </div>
            </div>
          )}

          {/* Step 2: Select Hub */}
          {step === 2 && (
            <div className="glass-card p-8 rounded-2xl animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Select Your Hub</h1>
                <p className="text-muted-foreground">Choose the category that best fits your project</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => setSelectedHub(hub.id)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedHub === hub.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-card/50"
                    }`}
                  >
                    <hub.icon className={`w-8 h-8 mx-auto mb-3 ${selectedHub === hub.id ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-medium text-foreground text-sm">{hub.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{hub.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Description */}
          {step === 3 && (
            <div className="glass-card p-8 rounded-2xl animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Describe Your Purpose</h1>
                <p className="text-muted-foreground">What problem are you solving? What's your vision?</p>
              </div>
              <div className="space-y-4">
                <Label htmlFor="description">Room Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project, the problem you're solving, and your vision for success..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">{description.length} / 20 minimum characters</p>
              </div>
            </div>
          )}

          {/* Step 4: Room Type */}
          {step === 4 && (
            <div className="glass-card p-8 rounded-2xl animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Choose Access Type</h1>
                <p className="text-muted-foreground">How do you want people to join your room?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setRoomType(type.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      roomType === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-card/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <type.icon className={`w-8 h-8 ${roomType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <h3 className="font-medium text-foreground">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: AI Analysis */}
          {step === 5 && (
            <div className="glass-card p-8 rounded-2xl animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-4">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">AI Analysis</h1>
                <p className="text-muted-foreground">Let our AI analyze your idea and provide insights</p>
              </div>
              
              <div className="glass-card p-6 rounded-xl mb-6 bg-card/50">
                <h3 className="font-medium text-foreground mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Room:</span> <span className="text-foreground">{roomName}</span></p>
                  <p><span className="text-muted-foreground">Hub:</span> <span className="text-foreground capitalize">{selectedHub}</span></p>
                  <p><span className="text-muted-foreground">Type:</span> <span className="text-foreground capitalize">{roomType.replace("-", " ")}</span></p>
                </div>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="w-full"
                variant="hero"
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing with AI...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze with AI</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Step 6: Results & Create */}
          {step === 6 && aiAnalysis && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-8 rounded-2xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-foreground mb-2">AI Analysis Complete</h1>
                  <p className="text-muted-foreground">Here's what our AI recommends for your project</p>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-muted-foreground">Success Score</span>
                    </div>
                    <p className="text-3xl font-bold text-green-400">{aiAnalysis.successScore}%</p>
                  </div>
                  <div className="p-6 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{aiAnalysis.riskScore}%</p>
                  </div>
                </div>

                {/* Budget */}
                <div className="p-6 bg-primary/10 rounded-xl border border-primary/20 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Estimated Budget</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{aiAnalysis.budgetEstimate}</p>
                </div>

                {/* Roadmap */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Suggested Roadmap</h3>
                  </div>
                  <div className="space-y-4">
                    {aiAnalysis.roadmap.map((phase, index) => (
                      <div key={index} className="p-4 bg-card/50 rounded-lg border border-border/50">
                        <h4 className="font-medium text-foreground mb-2">{phase.phase}</h4>
                        <ul className="space-y-1">
                          {phase.tasks.map((task, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Recommended Team</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.teamSuggestions.map((role, index) => (
                      <span key={index} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateRoom}
                disabled={creating}
                className="w-full"
                variant="hero"
                size="lg"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Room...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    <span>Create Room</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 6 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="hero"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                {step === 5 ? "View Results" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default CreateRoom;
