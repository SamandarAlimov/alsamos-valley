import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { MessageSquare, Users, TrendingUp, Clock, Award, Activity } from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RoomStatisticsProps {
  roomId: string;
  members: { user_id: string; role: string; joined_at: string }[];
  profiles: Record<string, Profile>;
}

interface MessageStats {
  total: number;
  today: number;
  thisWeek: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
  byDay: { date: string; count: number }[];
  byHour: { hour: string; count: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const RoomStatistics = ({ roomId, members, profiles }: RoomStatisticsProps) => {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      const startOfToday = startOfDay(now);

      // Fetch all messages
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId);

      if (!messages) {
        setLoading(false);
        return;
      }

      // Calculate stats
      const byType: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      const byHourMap: Record<number, number> = {};
      let today = 0;
      let thisWeek = 0;

      messages.forEach((msg) => {
        const date = new Date(msg.created_at);
        const type = msg.message_type || "text";
        const hour = date.getHours();

        byType[type] = (byType[type] || 0) + 1;
        byUser[msg.user_id] = (byUser[msg.user_id] || 0) + 1;
        byHourMap[hour] = (byHourMap[hour] || 0) + 1;

        if (date >= startOfToday) today++;
        if (date >= weekAgo) thisWeek++;
      });

      // Generate daily data for the last 7 days
      const days = eachDayOfInterval({ start: weekAgo, end: now });
      const byDay = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = messages.filter((msg) => {
          const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
          return msgDate === dayStr;
        }).length;
        return { date: format(day, "EEE"), count };
      });

      // Generate hourly data
      const byHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        count: byHourMap[i] || 0,
      }));

      setStats({
        total: messages.length,
        today,
        thisWeek,
        byType,
        byUser,
        byDay,
        byHour,
      });
      setLoading(false);
    };

    fetchStats();
  }, [roomId]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No statistics available yet</p>
      </div>
    );
  }

  // Top contributors
  const topContributors = Object.entries(stats.byUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userId, count]) => ({
      userId,
      count,
      profile: profiles[userId],
    }));

  // Message type data for pie chart
  const messageTypeData = Object.entries(stats.byType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Trend */}
        <Card className="bg-secondary/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Activity Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.byDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorCount)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Message Types */}
        <Card className="bg-secondary/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Message Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={messageTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {messageTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {messageTypeData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity by Hour */}
      <Card className="bg-secondary/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Activity by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  interval={2}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="bg-secondary/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topContributors.map((contributor, idx) => (
              <div 
                key={contributor.userId} 
                className="flex items-center justify-between p-3 rounded-lg bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-yellow-500 text-yellow-950" :
                      idx === 1 ? "bg-gray-300 text-gray-700" :
                      idx === 2 ? "bg-orange-400 text-orange-950" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </span>
                    <Avatar className="w-10 h-10 ml-2">
                      <AvatarImage src={contributor.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary text-primary text-xs">
                        {getInitials(contributor.profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {contributor.profile?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contributor.count} messages
                    </p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ 
                      width: `${(contributor.count / (topContributors[0]?.count || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
            {topContributors.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No contributors yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomStatistics;
