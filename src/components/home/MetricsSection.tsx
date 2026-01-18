import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Rocket, DollarSign, Layers, Zap } from "lucide-react";

interface RealMetrics {
  rooms: number;
  startups: number;
  members: number;
  investors: number;
  events: number;
  tasks: number;
}

const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "K";
    return num.toString();
  };

  return (
    <span>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

const MetricsSection = () => {
  const [metrics, setMetrics] = useState<RealMetrics>({
    rooms: 0,
    startups: 0,
    members: 0,
    investors: 0,
    events: 0,
    tasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [roomsRes, startupsRes, profilesRes, investorsRes, eventsRes, tasksRes] = await Promise.all([
          supabase.from("rooms").select("id", { count: "exact", head: true }),
          supabase.from("startups").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("investors").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }),
          supabase.from("tasks").select("id", { count: "exact", head: true }),
        ]);

        setMetrics({
          rooms: roomsRes.count || 0,
          startups: startupsRes.count || 0,
          members: profilesRes.count || 0,
          investors: investorsRes.count || 0,
          events: eventsRes.count || 0,
          tasks: tasksRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const metricsData = [
    { icon: Layers, label: "Total Rooms", value: metrics.rooms, suffix: "+" },
    { icon: Rocket, label: "Active Startups", value: metrics.startups, suffix: "+" },
    { icon: Users, label: "Community Members", value: metrics.members, suffix: "+" },
    { icon: Building, label: "Investors", value: metrics.investors, suffix: "+" },
    { icon: DollarSign, label: "Events", value: metrics.events, suffix: "" },
    { icon: Zap, label: "Tasks Created", value: metrics.tasks, suffix: "+" },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-cyber-blue/5 blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Powering the <span className="text-gradient">Innovation Engine</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time metrics from the Alsamos Valley ecosystem. 
            Watch the innovation happen in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {metricsData.map((metric) => (
            <div
              key={metric.label}
              className="metric-card group hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <metric.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-1">
                {loading ? "..." : <AnimatedCounter value={metric.value} suffix={metric.suffix} />}
              </div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
