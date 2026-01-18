import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, Search, Plus, Users, BookOpen, Clock,
  ArrowRight, Filter
} from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  hub: string;
  teacher_id: string;
  cover_image_url: string | null;
  max_students: number;
  is_public: boolean;
  created_at: string;
}

interface ClassroomWithStats extends Classroom {
  student_count: number;
  lesson_count: number;
  teacher_name: string | null;
}

const Classrooms = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomWithStats[]>([]);
  const [myClassrooms, setMyClassrooms] = useState<ClassroomWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "my" | "enrolled">("all");

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const fetchClassrooms = async () => {
    setLoading(true);
    
    // Fetch public classrooms
    const { data: publicClassrooms } = await supabase
      .from("classrooms")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (publicClassrooms) {
      const classroomsWithStats = await Promise.all(
        publicClassrooms.map(async (classroom) => {
          const [enrollments, lessons, teacher] = await Promise.all([
            supabase.from("classroom_enrollments").select("id").eq("classroom_id", classroom.id),
            supabase.from("lessons").select("id").eq("classroom_id", classroom.id).eq("is_published", true),
            supabase.from("profiles").select("full_name").eq("user_id", classroom.teacher_id).maybeSingle(),
          ]);

          return {
            ...classroom,
            student_count: enrollments.data?.length || 0,
            lesson_count: lessons.data?.length || 0,
            teacher_name: teacher.data?.full_name || null,
          };
        })
      );
      setClassrooms(classroomsWithStats);
    }

    // Fetch my classrooms (as teacher)
    if (user) {
      const { data: teacherClassrooms } = await supabase
        .from("classrooms")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (teacherClassrooms) {
        const classroomsWithStats = await Promise.all(
          teacherClassrooms.map(async (classroom) => {
            const [enrollments, lessons] = await Promise.all([
              supabase.from("classroom_enrollments").select("id").eq("classroom_id", classroom.id),
              supabase.from("lessons").select("id").eq("classroom_id", classroom.id),
            ]);

            return {
              ...classroom,
              student_count: enrollments.data?.length || 0,
              lesson_count: lessons.data?.length || 0,
              teacher_name: null,
            };
          })
        );
        setMyClassrooms(classroomsWithStats);
      }
    }

    setLoading(false);
  };

  const filteredClassrooms = (activeTab === "my" ? myClassrooms : classrooms).filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <main>
        {/* Header */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Ta'lim Platformasi</span>
                </div>
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
                  Dars <span className="text-gradient">Xonalari</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Virtual sinflar, kurslar va o'quv materiallari. O'qituvchi sifatida dars xonasi yarating 
                  yoki talaba sifatida kurslardan o'rganish boshlang.
                </p>
              </div>

              {user && (
                <Link to="/classrooms/create">
                  <Button variant="hero" size="lg">
                    <Plus className="w-4 h-4" />
                    Dars Xonasi Yaratish
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 sm:py-6 border-b border-border/50 sticky top-14 md:top-0 bg-background/95 backdrop-blur-xl z-30">
          <div className="section-container">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Barcha Kurslar
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => setActiveTab("my")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "my"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Mening Kurslarim
                    </button>
                    <button
                      onClick={() => setActiveTab("enrolled")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "enrolled"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Ro'yxatdan O'tganlar
                    </button>
                  </>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kurs qidirish..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Classrooms Grid */}
        <section className="py-12 lg:py-16">
          <div className="section-container">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredClassrooms.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {activeTab === "my" ? "Hali kurs yaratmagansiz" : "Kurslar topilmadi"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "my"
                    ? "Birinchi dars xonangizni yarating va o'qitishni boshlang"
                    : "Qidiruv so'rovingizga mos kurslar topilmadi"}
                </p>
                {activeTab === "my" && (
                  <Link to="/classrooms/create">
                    <Button variant="hero">
                      <Plus className="w-4 h-4" />
                      Dars Xonasi Yaratish
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClassrooms.map((classroom) => (
                  <Link
                    key={classroom.id}
                    to={`/classrooms/${classroom.id}`}
                    className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Cover Image */}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary relative overflow-hidden">
                      {classroom.cover_image_url ? (
                        <img
                          src={classroom.cover_image_url}
                          alt={classroom.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <GraduationCap className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground">
                        {classroom.hub}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                        {classroom.name}
                      </h3>
                      {classroom.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {classroom.description}
                        </p>
                      )}

                      {classroom.teacher_name && (
                        <p className="text-sm text-muted-foreground mb-4">
                          O'qituvchi: <span className="text-foreground">{classroom.teacher_name}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{classroom.student_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>{classroom.lesson_count} dars</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="py-16 lg:py-24">
            <div className="section-container">
              <div className="glass-card p-8 lg:p-12 text-center">
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-4">
                  O'qitishni yoki o'rganishni boshlang
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Ro'yxatdan o'ting va dars xonasi yarating yoki mavjud kurslarga qo'shiling
                </p>
                <Link to="/auth">
                  <Button variant="hero" size="lg">
                    Boshlash
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Classrooms;
