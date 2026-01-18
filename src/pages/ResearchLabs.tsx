import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, FlaskConical, Microscope, Atom, Dna, 
  Brain, Leaf, Zap, Users, BookOpen, Beaker
} from "lucide-react";

const fieldIcons: Record<string, React.ReactNode> = {
  chemistry: <FlaskConical className="w-5 h-5" />,
  biology: <Dna className="w-5 h-5" />,
  physics: <Atom className="w-5 h-5" />,
  medicine: <Microscope className="w-5 h-5" />,
  neuroscience: <Brain className="w-5 h-5" />,
  environmental: <Leaf className="w-5 h-5" />,
  engineering: <Zap className="w-5 h-5" />,
  default: <Beaker className="w-5 h-5" />,
};

const fieldColors: Record<string, string> = {
  chemistry: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  biology: "bg-green-500/10 text-green-500 border-green-500/20",
  physics: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medicine: "bg-red-500/10 text-red-500 border-red-500/20",
  neuroscience: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  environmental: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  engineering: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const fields = [
  { id: "all", label: "Hammasi" },
  { id: "chemistry", label: "Kimyo" },
  { id: "biology", label: "Biologiya" },
  { id: "physics", label: "Fizika" },
  { id: "medicine", label: "Tibbiyot" },
  { id: "neuroscience", label: "Neyrofan" },
  { id: "environmental", label: "Ekologiya" },
  { id: "engineering", label: "Muhandislik" },
];

const ResearchLabs = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("all");

  const { data: labs, isLoading } = useQuery({
    queryKey: ["research-labs", selectedField],
    queryFn: async () => {
      let query = supabase
        .from("research_labs")
        .select("*, lab_members(count)")
        .order("created_at", { ascending: false });

      if (selectedField !== "all") {
        query = query.eq("field", selectedField);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: myLabs } = useQuery({
    queryKey: ["my-research-labs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("research_labs")
        .select("*")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredLabs = labs?.filter(
    (lab) =>
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-8 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="section-container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <FlaskConical className="w-4 h-4" />
                Virtual Tadqiqot Laboratoriyalari
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
                Ilmiy Tadqiqotlar Markazi
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Kimyo, biologiya, fizika va boshqa sohalarda virtual laboratoriyalar yarating 
                va jamoaviy tadqiqotlar olib boring.
              </p>
              
              {user && (
                <Link to="/create-research-lab">
                  <Button variant="hero" size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    Laboratoriya yaratish
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="section-container py-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Laboratoriya qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <Button
                  key={field.id}
                  variant={selectedField === field.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedField(field.id)}
                  className="text-xs"
                >
                  {field.label}
                </Button>
              ))}
            </div>
          </div>

          {/* My Labs */}
          {user && myLabs && myLabs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" />
                Mening laboratoriyalarim
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myLabs.map((lab) => (
                  <LabCard key={lab.id} lab={lab} isOwner />
                ))}
              </div>
            </div>
          )}

          {/* All Labs */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Barcha laboratoriyalar
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLabs && filteredLabs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLabs.map((lab) => (
                  <LabCard key={lab.id} lab={lab} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Laboratoriya topilmadi</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Qidiruv natijasi bo'yicha laboratoriya topilmadi" 
                    : "Hozircha bu sohada laboratoriya mavjud emas"}
                </p>
                {user && (
                  <Link to="/create-research-lab">
                    <Button variant="hero">Birinchi laboratoriyani yarating</Button>
                  </Link>
                )}
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

interface LabCardProps {
  lab: {
    id: string;
    name: string;
    description: string | null;
    field: string;
    research_focus: string[] | null;
    status: string | null;
    funding_status: string | null;
    publications_count: number | null;
    lab_members?: { count: number }[];
  };
  isOwner?: boolean;
}

const LabCard = ({ lab, isOwner }: LabCardProps) => {
  const fieldColor = fieldColors[lab.field] || "bg-secondary text-secondary-foreground";
  const icon = fieldIcons[lab.field] || fieldIcons.default;
  const memberCount = lab.lab_members?.[0]?.count || 0;

  return (
    <Link to={`/research-labs/${lab.id}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/30 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className={`p-2.5 rounded-xl ${fieldColor} transition-transform group-hover:scale-110`}>
              {icon}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {isOwner && (
                <Badge variant="secondary" className="text-xs">Egasi</Badge>
              )}
              <Badge 
                variant="outline" 
                className={`text-xs capitalize ${
                  lab.status === 'active' ? 'border-green-500/50 text-green-500' :
                  lab.status === 'completed' ? 'border-blue-500/50 text-blue-500' :
                  'border-yellow-500/50 text-yellow-500'
                }`}
              >
                {lab.status === 'active' ? 'Faol' : lab.status === 'completed' ? 'Tugallangan' : 'To\'xtatilgan'}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-lg leading-tight mt-3 group-hover:text-primary transition-colors">
            {lab.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {lab.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {lab.description}
            </p>
          )}
          
          {lab.research_focus && lab.research_focus.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {lab.research_focus.slice(0, 3).map((focus, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {focus}
                </Badge>
              ))}
              {lab.research_focus.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{lab.research_focus.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{memberCount} a'zo</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lab.publications_count || 0} nashr</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ResearchLabs;