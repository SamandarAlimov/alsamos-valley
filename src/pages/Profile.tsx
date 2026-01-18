import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Calendar, Edit2, Save, X, Settings,
  Rocket, Users, MessageSquare, CheckSquare, Star,
  Plus
} from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { formatDistanceToNow, format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  last_seen: string | null;
}

interface UserStats {
  startups: number;
  rooms: number;
  messages: number;
  tasks: number;
  avgAiScore: number;
}

interface Room {
  id: string;
  name: string;
  hub: string;
  member_count: number | null;
  created_at: string;
}

interface Startup {
  id: string;
  name: string;
  stage: string | null;
  ai_score: number | null;
  hub: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({ startups: 0, rooms: 0, messages: 0, tasks: 0, avgAiScore: 0 });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "" });

  const targetUserId = userId || user?.id;
  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) return;

      setLoading(true);
      try {
        // Fetch profile
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (profileData) {
          setProfile(profileData);
          setEditForm({
            full_name: profileData.full_name || "",
            bio: profileData.bio || "",
          });
        }

        // Fetch user's rooms
        const { data: memberRooms } = await supabase
          .from("room_members")
          .select("room_id")
          .eq("user_id", targetUserId);

        if (memberRooms && memberRooms.length > 0) {
          const roomIds = memberRooms.map(m => m.room_id);
          const { data: roomsData } = await supabase
            .from("rooms")
            .select("id, name, hub, member_count, created_at")
            .in("id", roomIds)
            .order("created_at", { ascending: false })
            .limit(5);
          
          setRooms(roomsData || []);
        }

        // Fetch user's startups
        const { data: startupsData } = await supabase
          .from("startups")
          .select("id, name, stage, ai_score, hub")
          .eq("owner_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setStartups(startupsData || []);

        // Fetch user's tasks (only for own profile)
        if (isOwnProfile) {
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("id, title, status, priority, due_date")
            .eq("assigned_to", targetUserId)
            .order("created_at", { ascending: false })
            .limit(5);
          
          setTasks(tasksData || []);
        }

        // Fetch stats
        const [startupsRes, roomsRes, messagesRes, tasksRes] = await Promise.all([
          supabase.from("startups").select("id, ai_score").eq("owner_id", targetUserId),
          supabase.from("room_members").select("id", { count: "exact" }).eq("user_id", targetUserId),
          supabase.from("chat_messages").select("id", { count: "exact" }).eq("user_id", targetUserId),
          supabase.from("tasks").select("id", { count: "exact" }).eq("assigned_to", targetUserId),
        ]);

        const aiScores = startupsRes.data?.map(s => s.ai_score).filter(Boolean) as number[] || [];
        const avgAiScore = aiScores.length > 0 
          ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) 
          : 0;

        setStats({
          startups: startupsRes.data?.length || 0,
          rooms: roomsRes.count || 0,
          messages: messagesRes.count || 0,
          tasks: tasksRes.count || 0,
          avgAiScore,
        });
      } catch (error: unknown) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, isOwnProfile]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim() || null,
          bio: editForm.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setEditing(false);
      toast({ title: "Profil yangilandi", description: "Ma'lumotlar saqlandi" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Profilni yangilashda xatolik";
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <main>
        <section className="relative py-8 lg:py-12 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Profile Card */}
              <div className="glass-card p-6 lg:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {isOwnProfile ? (
                    <AvatarUpload
                      userId={user.id}
                      currentUrl={profile?.avatar_url || null}
                      name={profile?.full_name || null}
                      onUploadComplete={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
                      size="lg"
                    />
                  ) : (
                    <Avatar className="w-20 h-20 lg:w-24 lg:h-24 border-4 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 text-primary text-xl lg:text-2xl">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    {editing ? (
                      <div className="space-y-4">
                        <Input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="Ismingiz"
                          className="max-w-xs"
                        />
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="O'zingiz haqingizda..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saqlanmoqda..." : "Saqlash"}
                          </Button>
                          <Button variant="outline" onClick={() => setEditing(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Bekor qilish
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                          <h1 className="font-display font-bold text-2xl text-foreground">
                            {profile?.full_name || "Noma'lum foydalanuvchi"}
                          </h1>
                          {isOwnProfile && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Link to="/settings">
                                <Button variant="ghost" size="sm">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                        {profile?.bio && (
                          <p className="text-muted-foreground mb-4">{profile.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center sm:justify-start">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Qo'shilgan: {profile?.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : "yaqinda"}
                          </span>
                          {profile?.last_seen && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              Oxirgi faollik: {formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
                <div className="glass-card p-4 lg:p-6 text-center">
                  <Rocket className="w-5 h-5 lg:w-6 lg:h-6 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl lg:text-2xl text-foreground">{stats.startups}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Startaplar</div>
                </div>
                <div className="glass-card p-4 lg:p-6 text-center">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl lg:text-2xl text-foreground">{stats.rooms}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Xonalar</div>
                </div>
                <div className="glass-card p-4 lg:p-6 text-center">
                  <CheckSquare className="w-5 h-5 lg:w-6 lg:h-6 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl lg:text-2xl text-foreground">{stats.tasks}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Vazifalar</div>
                </div>
                <div className="glass-card p-4 lg:p-6 text-center">
                  <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl lg:text-2xl text-foreground">{stats.messages}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Xabarlar</div>
                </div>
                <div className="glass-card p-4 lg:p-6 text-center col-span-2 lg:col-span-1">
                  <Star className="w-5 h-5 lg:w-6 lg:h-6 text-primary mx-auto mb-2" />
                  <div className="font-display font-bold text-xl lg:text-2xl text-foreground">{stats.avgAiScore || "-"}</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">O'rtacha AI Ball</div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Rooms */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Xonalar
                    </h2>
                    {isOwnProfile && (
                      <Link to="/create-room">
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {rooms.length > 0 ? (
                    <div className="space-y-3">
                      {rooms.map((room) => (
                        <Link key={room.id} to={`/room/${room.id}`}>
                          <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-foreground">{room.name}</h3>
                                <p className="text-xs text-muted-foreground">{room.hub}</p>
                              </div>
                              <Badge variant="secondary">{room.member_count || 0} a'zo</Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali xonalar yo'q</p>
                    </div>
                  )}
                </div>

                {/* Startups */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-primary" />
                      Startaplar
                    </h2>
                    {isOwnProfile && (
                      <Link to="/submit-startup">
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {startups.length > 0 ? (
                    <div className="space-y-3">
                      {startups.map((startup) => (
                        <Link key={startup.id} to={`/startup/${startup.id}`}>
                          <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-foreground">{startup.name}</h3>
                                <p className="text-xs text-muted-foreground">{startup.stage || "Bosqich belgilanmagan"}</p>
                              </div>
                              {startup.ai_score && (
                                <Badge className="bg-primary/20 text-primary">
                                  AI: {startup.ai_score}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Rocket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Hali startaplar yo'q</p>
                    </div>
                  )}
                </div>

                {/* Tasks - Only for own profile */}
                {isOwnProfile && (
                  <div className="glass-card p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        Vazifalar
                      </h2>
                    </div>
                    
                    {tasks.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tasks.map((task) => (
                          <div key={task.id} className="p-3 rounded-lg bg-muted/50">
                            <h3 className="font-medium text-foreground mb-2 line-clamp-1">{task.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status === "completed" ? "Bajarildi" : task.status === "in_progress" ? "Jarayonda" : "Kutilmoqda"}
                              </Badge>
                              {task.priority && (
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority === "high" ? "Yuqori" : task.priority === "medium" ? "O'rta" : "Past"}
                                </Badge>
                              )}
                            </div>
                            {task.due_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Muddat: {format(new Date(task.due_date), "dd.MM.yyyy")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Hali vazifalar yo'q</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message button for other users */}
              {!isOwnProfile && user && (
                <div className="glass-card p-6 text-center mt-6">
                  <Button variant="hero">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Xabar yuborish
                  </Button>
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

export default Profile;
