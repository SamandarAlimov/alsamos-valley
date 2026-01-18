import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Clock, ArrowRight, Video, Rocket, Award, Zap } from "lucide-react";
import { format, isPast } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  event_type: string | null;
  max_attendees: number | null;
  is_virtual: boolean | null;
  image_url: string | null;
}

interface EventAttendee {
  event_id: string;
}

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, count, error } = await supabase
          .from("events")
          .select("*", { count: "exact" })
          .order("event_date", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
        setTotalEvents(count || 0);

        // Fetch attendee counts
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("event_id");

        if (attendees) {
          const counts: Record<string, number> = {};
          attendees.forEach((a: EventAttendee) => {
            counts[a.event_id] = (counts[a.event_id] || 0) + 1;
          });
          setAttendeeCounts(counts);
        }

        // Fetch user's registrations
        if (user) {
          const { data: userRegistrations } = await supabase
            .from("event_attendees")
            .select("event_id")
            .eq("user_id", user.id);

          if (userRegistrations) {
            setRegistrations(new Set(userRegistrations.map((r: EventAttendee) => r.event_id)));
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to register for events", variant: "destructive" });
      return;
    }

    setRegistering(eventId);
    try {
      if (registrations.has(eventId)) {
        // Unregister
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        setRegistrations((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setAttendeeCounts((prev) => ({ ...prev, [eventId]: (prev[eventId] || 1) - 1 }));
        toast({ title: "Unregistered", description: "You have been removed from this event" });
      } else {
        // Register
        const { error } = await supabase
          .from("event_attendees")
          .insert({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        setRegistrations((prev) => new Set([...prev, eventId]));
        setAttendeeCounts((prev) => ({ ...prev, [eventId]: (prev[eventId] || 0) + 1 }));
        toast({ title: "Registered!", description: "You are now registered for this event" });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to register";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setRegistering(null);
    }
  };

  const upcomingEvents = events.filter((e) => !isPast(new Date(e.event_date)));
  const pastEvents = events.filter((e) => isPast(new Date(e.event_date)));
  const featuredEvent = upcomingEvents[0];

  return (
    <AppLayout>
      <main>
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{upcomingEvents.length} Upcoming Events</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
                Events & <span className="text-gradient">Experiences</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Join demo days, workshops, hackathons, and networking events. 
                Connect with the innovation community in person and virtually.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Event */}
            {featuredEvent && (
              <section className="py-12">
                <div className="section-container">
                  <div className="glass-card p-8 lg:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-bl-xl">
                      Featured Event
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground capitalize">
                            {featuredEvent.event_type || "Event"}
                          </span>
                          {featuredEvent.is_virtual && (
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-xs font-medium text-primary">
                              Virtual Available
                            </span>
                          )}
                        </div>
                        
                        <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-4">
                          {featuredEvent.title}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          {featuredEvent.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-8">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-5 h-5" />
                            <span>{format(new Date(featuredEvent.event_date), "MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-5 h-5" />
                            <span>{format(new Date(featuredEvent.event_date), "HH:mm")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-5 h-5" />
                            <span>{featuredEvent.location || "TBD"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-5 h-5" />
                            <span>{attendeeCounts[featuredEvent.id] || 0} registered</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <Button 
                            variant={registrations.has(featuredEvent.id) ? "outline" : "hero"} 
                            size="lg"
                            onClick={() => handleRegister(featuredEvent.id)}
                            disabled={registering === featuredEvent.id}
                          >
                            {registering === featuredEvent.id 
                              ? "Processing..." 
                              : registrations.has(featuredEvent.id) 
                                ? "Cancel Registration" 
                                : "Register Now"
                            }
                          </Button>
                          {featuredEvent.is_virtual && (
                            <Button variant="hero-outline" size="lg">
                              <Video className="w-5 h-5" />
                              Join Virtually
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="hidden lg:flex items-center justify-center">
                        <div className="relative">
                          <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center animate-float">
                            <Rocket className="w-24 h-24 text-primary" />
                          </div>
                          <div className="absolute -inset-8 bg-gradient-to-r from-cyber-blue/10 to-neon-purple/10 rounded-full blur-3xl -z-10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 1 && (
              <section className="py-16 lg:py-24">
                <div className="section-container">
                  <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-8">
                    Upcoming <span className="text-gradient">Events</span>
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    {upcomingEvents.slice(1).map((event) => (
                      <div key={event.id} className="glass-card p-6 group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground capitalize">
                            {event.event_type || "Event"}
                          </span>
                          {event.is_virtual && (
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-xs font-medium text-primary flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Virtual
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                          {event.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-6 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(event.event_date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location || "TBD"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{attendeeCounts[event.id] || 0} attending</span>
                          </div>
                        </div>

                        <Button 
                          variant={registrations.has(event.id) ? "outline" : "default"} 
                          className="w-full group-hover:border-primary/50"
                          onClick={() => handleRegister(event.id)}
                          disabled={registering === event.id}
                        >
                          {registering === event.id 
                            ? "Processing..." 
                            : registrations.has(event.id) 
                              ? "Registered ✓" 
                              : "Register"
                          }
                          {!registrations.has(event.id) && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section className="py-16 lg:py-24 bg-gradient-to-b from-secondary/20 to-background">
                <div className="section-container">
                  <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-8">
                    Past <span className="text-gradient">Events</span>
                  </h2>

                  <div className="grid md:grid-cols-3 gap-6">
                    {pastEvents.slice(0, 6).map((event) => (
                      <div key={event.id} className="glass-card p-6 group hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), "MMMM yyyy")}
                          </span>
                        </div>
                        
                        <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {attendeeCounts[event.id] || 0}
                          </div>
                          <div className="flex items-center gap-1 capitalize">
                            {event.event_type || "Event"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Event Types */}
            <section className="py-16 lg:py-24">
              <div className="section-container">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-4">
                    Event <span className="text-gradient">Categories</span>
                  </h2>
                  <p className="text-muted-foreground">
                    From pitch competitions to hands-on workshops, there's something for everyone
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="glass-card p-6 text-center hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">Demo Days</h3>
                    <p className="text-sm text-muted-foreground">Watch startups pitch to investors</p>
                  </div>

                  <div className="glass-card p-6 text-center hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">Hackathons</h3>
                    <p className="text-sm text-muted-foreground">Build innovative solutions in 48 hours</p>
                  </div>

                  <div className="glass-card p-6 text-center hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">Workshops</h3>
                    <p className="text-sm text-muted-foreground">Learn from industry experts</p>
                  </div>

                  <div className="glass-card p-6 text-center hover:-translate-y-1 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">Networking</h3>
                    <p className="text-sm text-muted-foreground">Connect with founders and investors</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Events;
