import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  name: string | null;
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

const AvatarUpload = ({ userId, currentUrl, name, onUploadComplete, size = "lg" }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24 lg:w-28 lg:h-28",
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Xato fayl turi",
        description: "Faqat rasm fayllarini yuklash mumkin",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fayl juda katta",
        description: "Fayl hajmi 5MB dan oshmasligi kerak",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onUploadComplete(urlWithCacheBuster);
      toast({
        title: "Rasm yuklandi",
        description: "Profil rasmi muvaffaqiyatli yangilandi",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setPreviewUrl(null);
      toast({
        title: "Yuklashda xatolik",
        description: error instanceof Error ? error.message : "Rasmni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} border-4 border-primary/20 transition-all group-hover:border-primary/40`}>
        <AvatarImage src={displayUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 text-primary text-xl lg:text-2xl">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <Camera className="w-6 h-6 text-primary" />
        )}
      </div>

      {/* Cancel preview button */}
      {previewUrl && !uploading && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
          onClick={handleCancelPreview}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default AvatarUpload;
