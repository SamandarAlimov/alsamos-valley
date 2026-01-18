import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft, FlaskConical, Users, BookOpen, Plus, 
  Calendar, FileText, Beaker, Clock, CheckCircle2, 
  AlertCircle, PlayCircle, PauseCircle
} from "lucide-react";
import { format } from "date-fns";

interface MemberWithProfile {
  id: string;
  lab_id: string;
  user_id: string;
  role: string | null;
  specialization: string | null;
  joined_at: string;
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  analysis: "bg-purple-500/10 text-purple-500",
  completed: "bg-green-500/10 text-green-500",
  published: "bg-emerald-500/10 text-emerald-500",
};

const statusLabels: Record<string, string> = {
  planning: "Rejalashtirish",
  in_progress: "Jarayonda",
  analysis: "Tahlil",
  completed: "Tugallangan",
  published: "Nashr qilingan",
};

const ResearchLabDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    hypothesis: "",
    methodology: "",
  });

  const { data: lab, isLoading: labLoading } = useQuery({
    queryKey: ["research-lab", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_labs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery<MemberWithProfile[]>({
    queryKey: ["lab-members", id],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from("lab_members")
        .select("*")
        .eq("lab_id", id);
      if (error) throw error;
      
      // Fetch profiles separately
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        return membersData.map(member => ({
          ...member,
          profile: profilesData?.find(p => p.user_id === member.user_id) || null
        })) as MemberWithProfile[];
      }
      return membersData.map(m => ({ ...m, profile: null })) as MemberWithProfile[];
    },
    enabled: !!id,
  });

  const { data: projects } = useQuery({
    queryKey: ["lab-projects", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_projects")
        .select("*")
        .eq("lab_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isMember = members?.some((m) => m.user_id === user?.id);
  const isOwner = lab?.owner_id === user?.id;
  const userRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = isOwner || userRole === "lead";

  const joinLabMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Auth required");
      const { error } = await supabase
        .from("lab_members")
        .insert({ lab_id: id, user_id: user.id, role: "researcher" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Laboratoriyaga qo'shildingiz!");
      queryClient.invalidateQueries({ queryKey: ["lab-members", id] });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const leaveLabMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Auth required");
      const { error } = await supabase
        .from("lab_members")
        .delete()
        .eq("lab_id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Laboratoriyadan chiqdingiz");
      queryClient.invalidateQueries({ queryKey: ["lab-members", id] });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Lab ID required");
      const { error } = await supabase
        .from("research_projects")
        .insert({
          lab_id: id,
          title: newProject.title,
          description: newProject.description,
          hypothesis: newProject.hypothesis,
          methodology: newProject.methodology,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loyiha yaratildi!");
      queryClient.invalidateQueries({ queryKey: ["lab-projects", id] });
      setIsProjectDialogOpen(false);
      setNewProject({ title: "", description: "", hypothesis: "", methodology: "" });
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (labLoading) {
    return (
      <AppLayout>
        <main className="flex-1 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </main>
      </AppLayout>
    );
  }

  if (!lab) {
    return (
      <AppLayout>
        <main className="flex-1 flex items-center justify-center py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Laboratoriya topilmadi</h2>
            <p className="text-muted-foreground mb-4">
              Bu laboratoriya mavjud emas yoki o'chirilgan bo'lishi mumkin.
            </p>
            <Link to="/research-labs">
              <Button variant="hero">Laboratoriyalarga qaytish</Button>
            </Link>
          </Card>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="py-8">
        <div className="section-container">
          <Link to="/research-labs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Laboratoriyalarga qaytish
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                <FlaskConical className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{lab.name}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline" className="capitalize">
                    {lab.field}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={lab.status === 'active' ? 'border-green-500/50 text-green-500' : 'border-yellow-500/50 text-yellow-500'}
                  >
                    {lab.status === 'active' ? 'Faol' : 'To\'xtatilgan'}
                  </Badge>
                  {lab.funding_status && (
                    <Badge variant="secondary">{lab.funding_status}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {user && !isMember && (
                <Button 
                  variant="hero" 
                  onClick={() => joinLabMutation.mutate()}
                  disabled={joinLabMutation.isPending}
                >
                  Qo'shilish
                </Button>
              )}
              {isMember && !isOwner && (
                <Button 
                  variant="outline" 
                  onClick={() => leaveLabMutation.mutate()}
                  disabled={leaveLabMutation.isPending}
                >
                  Chiqish
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">A'zolar</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Loyihalar</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lab.publications_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Nashrlar</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(lab.created_at), "MMM yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">Yaratilgan</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Umumiy</TabsTrigger>
              <TabsTrigger value="projects">Loyihalar</TabsTrigger>
              <TabsTrigger value="members">A'zolar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {lab.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Laboratoriya haqida</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{lab.description}</p>
                  </CardContent>
                </Card>
              )}

              {lab.research_focus && lab.research_focus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tadqiqot yo'nalishlari</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lab.research_focus.map((focus: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tadqiqot loyihalari</h3>
                {isMember && (
                  <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Yangi loyiha
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Yangi tadqiqot loyihasi</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Loyiha nomi</Label>
                          <Input
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            placeholder="Loyiha nomini kiriting"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tavsif</Label>
                          <Textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            placeholder="Loyiha haqida qisqacha"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gipoteza</Label>
                          <Textarea
                            value={newProject.hypothesis}
                            onChange={(e) => setNewProject({ ...newProject, hypothesis: e.target.value })}
                            placeholder="Asosiy gipoteza"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Metodologiya</Label>
                          <Textarea
                            value={newProject.methodology}
                            onChange={(e) => setNewProject({ ...newProject, methodology: e.target.value })}
                            placeholder="Tadqiqot usullari"
                            rows={2}
                          />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => createProjectMutation.mutate()}
                          disabled={!newProject.title || createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending ? "Yaratilmoqda..." : "Loyiha yaratish"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {projects && projects.length > 0 ? (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{project.title}</h4>
                              <Badge className={statusColors[project.status || 'planning']}>
                                {statusLabels[project.status || 'planning']}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                            )}
                            {project.hypothesis && (
                              <div className="text-sm">
                                <span className="font-medium">Gipoteza:</span>{" "}
                                <span className="text-muted-foreground">{project.hypothesis}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(project.created_at), "dd MMM yyyy")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Beaker className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Hali loyihalar yo'q</h3>
                    <p className="text-muted-foreground text-sm">
                      Birinchi tadqiqot loyihasini yarating
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <h3 className="text-lg font-semibold">Laboratoriya a'zolari</h3>
              {members && members.length > 0 ? (
                <div className="grid gap-3">
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {member.profile?.full_name?.[0] || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.profile?.full_name || "Noma'lum"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role || "A'zo"}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(member.joined_at), "dd MMM yyyy")}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Hali a'zolar yo'q</h3>
                    <p className="text-muted-foreground text-sm">
                      Laboratoriyaga qo'shilish uchun yuqoridagi tugmani bosing
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
};

export default ResearchLabDetail;