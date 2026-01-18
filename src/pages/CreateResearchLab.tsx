import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FlaskConical, X, Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const fields = [
  { id: "chemistry", label: "Kimyo", description: "Kimyoviy tadqiqotlar va reaksiyalar" },
  { id: "biology", label: "Biologiya", description: "Tirik organizmlar va biosistemalar" },
  { id: "physics", label: "Fizika", description: "Moddiy olam qonunlari" },
  { id: "medicine", label: "Tibbiyot", description: "Sog'liq va davolash tadqiqotlari" },
  { id: "neuroscience", label: "Neyrofan", description: "Miya va asab tizimi" },
  { id: "environmental", label: "Ekologiya", description: "Atrof-muhit va tabiat" },
  { id: "engineering", label: "Muhandislik", description: "Texnik yechimlar va ixtirolar" },
];

const CreateResearchLab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState("");
  const [hub, setHub] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(20);
  const [researchFocus, setResearchFocus] = useState<string[]>([]);
  const [focusInput, setFocusInput] = useState("");

  const createLabMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Foydalanuvchi topilmadi");
      
      // Create lab
      const { data: lab, error: labError } = await supabase
        .from("research_labs")
        .insert({
          name,
          description,
          field,
          hub: hub || null,
          is_public: isPublic,
          max_members: maxMembers,
          research_focus: researchFocus,
          owner_id: user.id,
        })
        .select()
        .single();

      if (labError) throw labError;

      // Add owner as lead member
      const { error: memberError } = await supabase
        .from("lab_members")
        .insert({
          lab_id: lab.id,
          user_id: user.id,
          role: "lead",
        });

      if (memberError) throw memberError;

      return lab;
    },
    onSuccess: (lab) => {
      toast.success("Laboratoriya muvaffaqiyatli yaratildi!");
      navigate(`/research-labs/${lab.id}`);
    },
    onError: (error) => {
      console.error("Lab creation error:", error);
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    },
  });

  const handleAddFocus = () => {
    if (focusInput.trim() && !researchFocus.includes(focusInput.trim())) {
      setResearchFocus([...researchFocus, focusInput.trim()]);
      setFocusInput("");
    }
  };

  const handleRemoveFocus = (focus: string) => {
    setResearchFocus(researchFocus.filter((f) => f !== focus));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !field) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    createLabMutation.mutate();
  };

  if (!user) {
    return (
      <AppLayout>
        <main className="flex-1 flex items-center justify-center py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Kirish talab qilinadi</h2>
              <p className="text-muted-foreground mb-4">
                Laboratoriya yaratish uchun tizimga kirishingiz kerak.
              </p>
              <Link to="/auth">
                <Button variant="hero">Tizimga kirish</Button>
              </Link>
            </CardContent>
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

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Yangi laboratoriya yaratish</h1>
              <p className="text-muted-foreground">
                Virtual tadqiqot laboratoriyangizni sozlang va jamoangizni to'plang
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Asosiy ma'lumotlar</CardTitle>
                  <CardDescription>Laboratoriya haqida umumiy ma'lumotlar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Laboratoriya nomi *</Label>
                    <Input
                      id="name"
                      placeholder="Masalan: Nanomateriallar tadqiqot laboratoriyasi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Tavsif</Label>
                    <Textarea
                      id="description"
                      placeholder="Laboratoriya faoliyati va maqsadlari haqida..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tadqiqot sohasi *</Label>
                    <Select value={field} onValueChange={setField} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sohani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            <div>
                              <div className="font-medium">{f.label}</div>
                              <div className="text-xs text-muted-foreground">{f.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tadqiqot yo'nalishlari</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Masalan: Kvant fizikasi"
                        value={focusInput}
                        onChange={(e) => setFocusInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFocus())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddFocus}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {researchFocus.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {researchFocus.map((focus) => (
                          <Badge key={focus} variant="secondary" className="gap-1">
                            {focus}
                            <button
                              type="button"
                              onClick={() => handleRemoveFocus(focus)}
                              className="hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hub">Hub (ixtiyoriy)</Label>
                    <Select value={hub} onValueChange={setHub}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hubni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="science">Fan va texnologiya</SelectItem>
                        <SelectItem value="medicine">Tibbiyot</SelectItem>
                        <SelectItem value="engineering">Muhandislik</SelectItem>
                        <SelectItem value="education">Ta'lim</SelectItem>
                        <SelectItem value="research">Tadqiqot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxMembers">Maksimal a'zolar soni</Label>
                      <Input
                        id="maxMembers"
                        type="number"
                        min={1}
                        max={100}
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label htmlFor="isPublic" className="cursor-pointer">Ommaviy</Label>
                        <p className="text-xs text-muted-foreground">
                          Barchaga ko'rinadi
                        </p>
                      </div>
                      <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 mt-6">
                <Link to="/research-labs" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Bekor qilish
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  variant="hero" 
                  className="flex-1"
                  disabled={createLabMutation.isPending}
                >
                  {createLabMutation.isPending ? "Yaratilmoqda..." : "Laboratoriya yaratish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default CreateResearchLab;