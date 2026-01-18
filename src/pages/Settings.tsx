import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import AppLayout from "@/components/layout/AppLayout";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Palette,
  Lock,
  Mail,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Type,
  MessageSquare,
  CheckSquare,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  task_notifications: boolean;
  theme: string;
  language: string;
  compact_mode: boolean;
}

const defaultSettings: UserSettings = {
  email_notifications: true,
  push_notifications: true,
  message_notifications: true,
  task_notifications: true,
  theme: "system",
  language: "uz",
  compact_mode: false,
};

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Account settings
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading settings:", error);
          return;
        }

        if (data) {
          setSettings({
            email_notifications: data.email_notifications ?? true,
            push_notifications: data.push_notifications ?? true,
            message_notifications: data.message_notifications ?? true,
            task_notifications: data.task_notifications ?? true,
            theme: data.theme ?? "system",
            language: data.language ?? "uz",
            compact_mode: data.compact_mode ?? false,
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Save settings to database
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user?.id) return;

    setSaving(true);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Saqlandi",
        description: "Sozlamalar muvaffaqiyatli saqlandi",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Xatolik",
        description: "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (value: string) => {
    await setTheme(value as "light" | "dark" | "system");
    saveSettings({ theme: value });
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Xatolik",
        description: "Yangi parollar mos kelmaydi",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Xatolik",
        description: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat",
        description: "Parol muvaffaqiyatli o'zgartirildi",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Parolni o'zgartirishda xatolik";
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({ title: "Chiqildi", description: "Hisobingizdan chiqdingiz" });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Kirish talab etiladi</h2>
            <Button onClick={() => navigate("/auth")}>Kirish</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main>
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="section-container relative z-10">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="font-display font-bold text-3xl text-foreground">
                  Sozlamalar
                </h1>
                {saving && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saqlanmoqda...
                  </div>
                )}
              </div>

              {/* Account Settings */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display font-semibold text-xl text-foreground">
                    Hisob
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input value={email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Emailni o'zgartirish hozircha mavjud emas
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Lock className="w-4 h-4" />
                      Parolni o'zgartirish
                    </Label>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Yangi parol"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Yangi parolni tasdiqlash"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Button
                        onClick={handlePasswordChange}
                        disabled={changingPassword || !newPassword}
                        className="w-full"
                      >
                        {changingPassword ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Chiqish
                  </Button>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display font-semibold text-xl text-foreground">
                    Bildirishnomalar
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Email bildirishnomalar</span>
                        <p className="text-xs text-muted-foreground">Muhim yangiliklar emailga yuboriladi</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => saveSettings({ email_notifications: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Push bildirishnomalar</span>
                        <p className="text-xs text-muted-foreground">Brauzer orqali bildirishnomalar</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => saveSettings({ push_notifications: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Xabar bildirishnomalari</span>
                        <p className="text-xs text-muted-foreground">Yangi xabarlar haqida xabar berish</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.message_notifications}
                      onCheckedChange={(checked) => saveSettings({ message_notifications: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Vazifa bildirishnomalari</span>
                        <p className="text-xs text-muted-foreground">Vazifalar bo'yicha eslatmalar</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.task_notifications}
                      onCheckedChange={(checked) => saveSettings({ task_notifications: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display font-semibold text-xl text-foreground">
                    Ko'rinish
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      {theme === "dark" ? (
                        <Moon className="w-4 h-4" />
                      ) : theme === "light" ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                      Mavzu
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex items-center gap-2"
                        onClick={() => handleThemeChange("light")}
                      >
                        <Sun className="w-4 h-4" />
                        Yorug'
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex items-center gap-2"
                        onClick={() => handleThemeChange("dark")}
                      >
                        <Moon className="w-4 h-4" />
                        Qorong'i
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex items-center gap-2"
                        onClick={() => handleThemeChange("system")}
                      >
                        <Monitor className="w-4 h-4" />
                        Tizim
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {theme === "system" && "Qurilmangiz sozlamalariga qarab avtomatik o'zgaradi"}
                    </p>
                  </div>

                  {/* Language */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Til
                    </Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => saveSettings({ language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uz">O'zbekcha</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Compact Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Ixcham rejim</span>
                      <p className="text-xs text-muted-foreground">Interfeysni kichikroq ko'rsatish</p>
                    </div>
                    <Switch
                      checked={settings.compact_mode}
                      onCheckedChange={(checked) => saveSettings({ compact_mode: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AppLayout>
  );
};

export default Settings;
