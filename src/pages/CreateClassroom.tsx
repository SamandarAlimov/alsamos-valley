import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";

const hubs = [
  { id: "tech", name: "Texnologiya" },
  { id: "science", name: "Ilmiy Tadqiqot" },
  { id: "medicine", name: "Tibbiyot" },
  { id: "education", name: "Ta'lim" },
  { id: "business", name: "Biznes" },
  { id: "engineering", name: "Muhandislik" },
  { id: "creative", name: "Ijodiy" },
];

const CreateClassroom = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hub: "",
    max_students: 50,
    is_public: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Xato", description: "Avval tizimga kiring", variant: "destructive" });
      return;
    }

    if (!formData.name.trim() || !formData.hub) {
      toast({ title: "Xato", description: "Iltimos, barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Generate enrollment code
    const enrollmentCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("classrooms")
      .insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        hub: formData.hub,
        teacher_id: user.id,
        max_students: formData.max_students,
        is_public: formData.is_public,
        enrollment_code: enrollmentCode,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Enroll teacher as instructor
    await supabase.from("classroom_enrollments").insert({
      classroom_id: data.id,
      user_id: user.id,
      role: "instructor",
    });

    toast({ title: "Muvaffaqiyat!", description: "Dars xonasi yaratildi" });
    navigate(`/classrooms/${data.id}`);
  };

  if (!user) {
    return (
      <AppLayout>
        <main className="py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Tizimga kiring</h1>
          <p className="text-muted-foreground mt-2">Dars xonasi yaratish uchun avval tizimga kiring</p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </button>

          <div className="glass-card p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-foreground">Yangi Dars Xonasi</h1>
                <p className="text-sm text-muted-foreground">Virtual sinfingizni yarating</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Kurs nomi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Python Dasturlash Asoslari"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kurs haqida qisqacha ma'lumot..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hub">Soha *</Label>
                <Select value={formData.hub} onValueChange={(value) => setFormData({ ...formData, hub: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sohani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((hub) => (
                      <SelectItem key={hub.id} value={hub.id}>
                        {hub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_students">Maksimal talabalar soni</Label>
                <Input
                  id="max_students"
                  type="number"
                  min={1}
                  max={500}
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 50 })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <Label htmlFor="is_public" className="font-medium">Ommaviy kurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Ommaviy kurslar barcha foydalanuvchilarga ko'rinadi
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  "Dars Xonasini Yaratish"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default CreateClassroom;
