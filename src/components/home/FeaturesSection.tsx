import { Lightbulb, Users, Rocket, Bot, DollarSign, GraduationCap, HeartHandshake } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Rooms",
    description: "Smart workspaces with AI assistants that help manage tasks, analyze ideas, and optimize workflows.",
  },
  {
    icon: Users,
    title: "Team Formation",
    description: "AI matches you with the perfect co-founders, developers, designers, and mentors for your vision.",
  },
  {
    icon: Rocket,
    title: "Startup Accelerator",
    description: "From idea to launch in weeks. Get structured guidance, resources, and milestones.",
  },
  {
    icon: Lightbulb,
    title: "MVP Builder",
    description: "Build your minimum viable product with integrated tools, templates, and expert support.",
  },
  {
    icon: DollarSign,
    title: "Funding & Investors",
    description: "Connect with vetted investors, showcase your pitch deck, and secure funding.",
  },
  {
    icon: GraduationCap,
    title: "Research & Courses",
    description: "Access curated learning paths and research resources from courses.alsamos.com.",
  },
  {
    icon: HeartHandshake,
    title: "Community Collaboration",
    description: "Join vibrant communities, attend events, and build lasting professional relationships.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="section-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Everything You Need to <span className="text-gradient">Innovate</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Alsamos Valley is a full ecosystem for ideas, projects, talent, startups, and innovation. 
            All hubs, rooms, and project workflows live here.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-6 lg:p-8 group hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
