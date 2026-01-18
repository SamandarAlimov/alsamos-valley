import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-cyber-blue/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-neon-purple/10 blur-3xl" />

      <div className="section-container relative z-10">
        <div className="glass-card p-8 lg:p-16 text-center max-w-4xl mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center mx-auto mb-8 animate-float">
            <Rocket className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Heading */}
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
            Start Building Your <span className="text-gradient">Future</span> Today
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of innovators, entrepreneurs, and visionaries who are shaping 
            the future of Central Asia. Your next big idea starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="group">
              <Sparkles className="w-5 h-5" />
              Create Your Room
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="hero-outline" size="xl">
              Explore the Valley
            </Button>
          </div>

          {/* Trust Indicators */}
          <p className="mt-10 text-sm text-muted-foreground">
            Trusted by 250+ startups • $5M+ funded • Backed by Alsamos Corp.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
