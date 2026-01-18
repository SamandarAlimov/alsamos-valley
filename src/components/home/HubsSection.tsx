import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Briefcase, GraduationCap, Palette, Heart, TrendingUp, FlaskConical, Stethoscope, Atom, Building2, Leaf, Rocket } from "lucide-react";

const hubs = [
  {
    id: "tech",
    icon: Cpu,
    name: "Texnologiya Hub",
    description: "Dasturiy ta'minot, sun'iy intellekt, apparat va chuqur texnologiyalar",
    rooms: 156,
    members: 2340,
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "science",
    icon: FlaskConical,
    name: "Ilmiy Tadqiqot Hub",
    description: "Kimyo, fizika, biologiya va ilmiy izlanishlar markazi",
    rooms: 84,
    members: 1120,
    color: "from-purple-500 to-indigo-400",
  },
  {
    id: "medicine",
    icon: Stethoscope,
    name: "Tibbiyot Hub",
    description: "Tibbiy tadqiqotlar, farmatsevtika va biotexnologiya",
    rooms: 68,
    members: 890,
    color: "from-red-500 to-pink-400",
  },
  {
    id: "education",
    icon: GraduationCap,
    name: "Ta'lim Hub",
    description: "EdTech, o'quv platformalari va malaka oshirish",
    rooms: 92,
    members: 1580,
    color: "from-violet-500 to-purple-400",
  },
  {
    id: "business",
    icon: Briefcase,
    name: "Biznes Hub",
    description: "Biznes modellari, operatsiyalar va bozor strategiyalari",
    rooms: 98,
    members: 1580,
    color: "from-emerald-500 to-teal-400",
  },
  {
    id: "investment",
    icon: TrendingUp,
    name: "Investitsiya Hub",
    description: "Investor tarmoqlari, moliyalashtirish va moliyaviy o'sish",
    rooms: 56,
    members: 720,
    color: "from-cyber-blue to-neon-purple",
  },
  {
    id: "creative",
    icon: Palette,
    name: "Ijodiy Hub",
    description: "Dizayn, media, kontent va ijodiy sohalar",
    rooms: 64,
    members: 720,
    color: "from-pink-500 to-rose-400",
  },
  {
    id: "sustainability",
    icon: Leaf,
    name: "Ekologiya Hub",
    description: "Barqaror rivojlanish, yashil texnologiyalar",
    rooms: 42,
    members: 480,
    color: "from-green-500 to-emerald-400",
  },
  {
    id: "engineering",
    icon: Atom,
    name: "Muhandislik Hub",
    description: "Mexanika, elektrotexnika va qurilish loyihalari",
    rooms: 76,
    members: 940,
    color: "from-orange-500 to-amber-400",
  },
  {
    id: "social",
    icon: Heart,
    name: "Ijtimoiy Ta'sir Hub",
    description: "Jamiyat loyihalari va ijtimoiy tadbirkorlik",
    rooms: 48,
    members: 560,
    color: "from-rose-500 to-red-400",
  },
  {
    id: "startup",
    icon: Rocket,
    name: "Startaplar Hub",
    description: "Yangi g'oyalar, startaplar va akselerator dasturlari",
    rooms: 124,
    members: 2100,
    color: "from-yellow-500 to-orange-400",
  },
  {
    id: "realestate",
    icon: Building2,
    name: "Ko'chmas Mulk Hub",
    description: "Qurilish, arxitektura va ko'chmas mulk loyihalari",
    rooms: 38,
    members: 420,
    color: "from-slate-500 to-gray-400",
  },
];

const HubsSection = () => {
  // Show first 6 on homepage
  const displayedHubs = hubs.slice(0, 6);

  return (
    <section className="relative py-12 sm:py-16 lg:py-32">
      <div className="section-container">
        {/* Section Header */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row items-start lg:items-end justify-between mb-6 sm:mb-8 lg:mb-12">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mb-2 sm:mb-4">
              <span className="text-gradient">Innovatsiya Hublari</span>ni O'rganing
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
              Soha va mutaxassislik bo'yicha tashkil etilgan ixtisoslashgan jamoalarga qo'shiling. 
              Har bir hubda g'oyalar haqiqatga aylanadigan xonalar mavjud.
            </p>
          </div>
          <Link to="/hubs">
            <Button variant="outline" size="default" className="shrink-0 group sm:size-lg">
              <span className="hidden sm:inline">Barcha Hublar</span>
              <span className="sm:hidden">Barchasi</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform ml-1" />
            </Button>
          </Link>
        </div>

        {/* Hubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {displayedHubs.map((hub) => (
            <Link
              key={hub.id}
              to={`/hubs/${hub.id}`}
              className="hub-card group cursor-pointer"
            >
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${hub.color} flex items-center justify-center mb-3 sm:mb-4 lg:mb-5 group-hover:scale-110 transition-transform`}>
                <hub.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-base sm:text-lg lg:text-xl text-foreground mb-1.5 sm:mb-2 line-clamp-1">
                {hub.name}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 lg:mb-5 line-clamp-2">
                {hub.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 lg:pt-5 border-t border-border/50">
                <div>
                  <div className="font-display font-bold text-sm sm:text-base lg:text-lg text-foreground">{hub.rooms}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Xonalar</div>
                </div>
                <div>
                  <div className="font-display font-bold text-sm sm:text-base lg:text-lg text-foreground">{hub.members.toLocaleString()}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">A'zolar</div>
                </div>
              </div>

              {/* Explore Link */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 lg:mt-5 text-primary font-medium text-xs sm:text-sm group-hover:gap-3 transition-all">
                Hubni o'rganing
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export { hubs };
export default HubsSection;
