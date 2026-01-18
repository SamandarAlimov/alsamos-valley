import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, GraduationCap, Users, BookOpen, Plus, Settings,
  PlayCircle, CheckCircle, Clock, FileText, Upload, Loader2,
  Share2, Copy, Edit, Trash2
} from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  hub: string;
  teacher_id: string;
  max_students: number;
  is_public: boolean;
  enrollment_code: string | null;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_published: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  role: string;
  enrolled_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ClassroomDetail = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", content: "" });
  const [savingLesson, setSavingLesson] = useState(false);

  useEffect(() => {
    if (classroomId) {
      fetchClassroom();
    }
  }, [classroomId, user]);

  const fetchClassroom = async () => {
    if (!classroomId) return;

    const { data: classroomData } = await supabase
      .from("classrooms")
      .select("*")
      .eq("id", classroomId)
      .maybeSingle();

    if (classroomData) {
      setClassroom(classroomData);
      setIsTeacher(classroomData.teacher_id === user?.id);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("order_index");

      if (lessonsData) setLessons(lessonsData);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at");

      if (assignmentsData) setAssignments(assignmentsData);

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from("classroom_enrollments")
        .select("*")
        .eq("classroom_id", classroomId);

      if (enrollmentsData) {
        const userIds = enrollmentsData.map((e) => e.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const enriched = enrollmentsData.map((e) => ({
          ...e,
          profile: profiles?.find((p) => p.user_id === e.user_id),
        }));

        setEnrollments(enriched);
        setIsEnrolled(enrollmentsData.some((e) => e.user_id === user?.id));
      }
    }

    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user || !classroomId) {
      toast({ title: "Xato", description: "Avval tizimga kiring", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("classroom_enrollments").insert({
      classroom_id: classroomId,
      user_id: user.id,
      role: "student",
    });

    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Muvaffaqiyat!", description: "Kursga muvaffaqiyatli yozildingiz" });
      setIsEnrolled(true);
      fetchClassroom();
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast({ title: "Xato", description: "Dars nomini kiriting", variant: "destructive" });
      return;
    }

    setSavingLesson(true);

    const { error } = await supabase.from("lessons").insert({
      classroom_id: classroomId,
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || null,
      content: lessonForm.content.trim() || null,
      order_index: lessons.length,
      is_published: false,
    });

    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Muvaffaqiyat!", description: "Dars qo'shildi" });
      setShowLessonForm(false);
      setLessonForm({ title: "", description: "", content: "" });
      fetchClassroom();
    }

    setSavingLesson(false);
  };

  const toggleLessonPublish = async (lessonId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !currentStatus })
      .eq("id", lessonId);

    if (!error) {
      toast({ title: currentStatus ? "Dars yashirildi" : "Dars e'lon qilindi" });
      fetchClassroom();
    }
  };

  const copyEnrollmentCode = () => {
    if (classroom?.enrollment_code) {
      navigator.clipboard.writeText(classroom.enrollment_code);
      toast({ title: "Nusxalandi!", description: "Ro'yxatga olish kodi nusxalandi" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <AppLayout>
        <main className="py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Dars xonasi topilmadi</h1>
          <Link to="/classrooms" className="text-primary mt-4 inline-block">
            Barcha kurslarga qaytish
          </Link>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="py-6">
        {/* Header */}
        <section className="relative py-8 lg:py-12 border-b border-border/50">
          <div className="section-container">
            <Link
              to="/classrooms"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Barcha kurslar
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{classroom.hub}</span>
                    <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
                      {classroom.name}
                    </h1>
                  </div>
                </div>
                {classroom.description && (
                  <p className="text-muted-foreground max-w-2xl">{classroom.description}</p>
                )}

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{enrollments.length} talaba</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{lessons.filter((l) => l.is_published).length} dars</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isTeacher && (
                  <>
                    <Button variant="outline" onClick={copyEnrollmentCode}>
                      <Share2 className="w-4 h-4" />
                      Kod: {classroom.enrollment_code}
                    </Button>
                  </>
                )}
                {!isEnrolled && !isTeacher && user && (
                  <Button variant="hero" onClick={handleEnroll}>
                    Kursga yozilish
                  </Button>
                )}
                {isEnrolled && !isTeacher && (
                  <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Ro'yxatdan o'tgansiz
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="section-container">
            <Tabs defaultValue="lessons" className="space-y-6">
              <TabsList>
                <TabsTrigger value="lessons">Darslar</TabsTrigger>
                <TabsTrigger value="assignments">Topshiriqlar</TabsTrigger>
                <TabsTrigger value="students">Talabalar</TabsTrigger>
                {isTeacher && <TabsTrigger value="settings">Sozlamalar</TabsTrigger>}
              </TabsList>

              <TabsContent value="lessons" className="space-y-4">
                {isTeacher && (
                  <Dialog open={showLessonForm} onOpenChange={setShowLessonForm}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="w-4 h-4" />
                        Yangi dars qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yangi dars yaratish</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Input
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            placeholder="Dars nomi"
                          />
                        </div>
                        <div>
                          <Textarea
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            placeholder="Qisqacha tavsif"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Textarea
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            placeholder="Dars kontenti (Markdown qo'llab-quvvatlanadi)"
                            rows={6}
                          />
                        </div>
                        <Button onClick={handleCreateLesson} disabled={savingLesson} className="w-full">
                          {savingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : "Darsni saqlash"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {lessons.length === 0 ? (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Hali darslar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={`glass-card p-4 flex items-center justify-between ${
                          !lesson.is_published && !isTeacher ? "hidden" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground">{lesson.description}</p>
                            )}
                            {!lesson.is_published && (
                              <span className="text-xs text-yellow-500">Qoralama</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.duration_minutes && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {lesson.duration_minutes} min
                            </span>
                          )}
                          {isTeacher && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLessonPublish(lesson.id, lesson.is_published)}
                            >
                              {lesson.is_published ? "Yashirish" : "E'lon qilish"}
                            </Button>
                          )}
                          {(isEnrolled || isTeacher) && lesson.is_published && (
                            <Button variant="ghost" size="sm">
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Hali topshiriqlar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="glass-card p-4">
                        <h3 className="font-medium text-foreground">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        )}
                        {assignment.due_date && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Muddat: {new Date(assignment.due_date).toLocaleDateString("uz-UZ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="glass-card rounded-xl divide-y divide-border/50">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {enrollment.profile?.full_name?.[0] || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {enrollment.profile?.full_name || "Noma'lum"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{enrollment.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(enrollment.enrolled_at).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {isTeacher && (
                <TabsContent value="settings" className="space-y-4">
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-semibold text-lg mb-4">Kurs sozlamalari</h3>
                    <p className="text-muted-foreground">Sozlamalar tez orada qo'shiladi...</p>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </section>
      </main>
    </AppLayout>
  );
};

export default ClassroomDetail;