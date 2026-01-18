import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Rocket } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="hero-glow" />
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyber-blue/5 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-purple/5 blur-3xl animate-float animation-delay-300" />

      <div className="section-container relative z-10 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">AI-Powered Innovation Ecosystem</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-in animation-delay-100">
            <span className="text-foreground">The Future</span>
            <br />
            <span className="text-gradient text-glow">Innovation Valley</span>
            <br />
            <span className="text-foreground">of Uzbekistan</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in animation-delay-200">
            Alsamos Valley is the official startup ecosystem inspired by Silicon Valley. 
            Build ideas, form teams, launch startups, and connect with investors — all powered by AI.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in animation-delay-300">
            <Button variant="hero" size="xl" className="group">
              Create Room
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="hero-outline" size="xl">
              Join a Hub
            </Button>
            <Button variant="glass" size="xl">
              Explore Startups
            </Button>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-xl mx-auto animate-fade-in animation-delay-400">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-foreground">250+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Startups</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-foreground">12K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Community Members</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-foreground">$5M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Funded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
