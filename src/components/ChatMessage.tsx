import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageReactions from "@/components/MessageReactions";
import FilePreviewModal from "@/components/FilePreviewModal";
import { Play, Pause, FileText, Mic, Video, Download, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  message_type?: string;
  reply_to?: string | null;
}

interface ChatMessageProps {
  message: Message;
  profile?: Profile;
  isOwn: boolean;
  replyToMessage?: Message | null;
  replyToProfile?: Profile;
  attachments?: FileAttachment[];
  onReply: (messageId: string) => void;
}

const ChatMessage = ({ 
  message, 
  profile, 
  isOwn, 
  replyToMessage, 
  replyToProfile,
  attachments = [],
  onReply 
}: ChatMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm");
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const previewFiles = attachments.map((att) => ({
    url: att.file_url,
    name: att.file_name,
    type: att.file_type,
  }));

  const renderAttachment = (attachment: FileAttachment, index: number) => {
    const isImage = attachment.file_type.startsWith("image/");
    const isVideo = attachment.file_type.startsWith("video/");
    const isAudio = attachment.file_type.startsWith("audio/");

    if (isImage) {
      return (
        <button 
          onClick={() => openPreview(index)}
          className="block rounded-xl overflow-hidden max-w-[280px] sm:max-w-xs group cursor-pointer"
        >
          <div className="relative">
            <img 
              src={attachment.thumbnail_url || attachment.file_url} 
              alt={attachment.file_name}
              className="w-full h-auto object-cover rounded-xl"
            />
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
              <span className="text-[10px] text-white font-medium">{formatTime(message.created_at)}</span>
              {isOwn && <CheckCheck className="w-3 h-3 text-primary" />}
            </div>
          </div>
        </button>
      );
    }

    if (isVideo) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[280px] sm:max-w-xs bg-secondary/30">
          <button onClick={() => openPreview(index)} className="w-full relative group">
            <video 
              src={attachment.file_url} 
              className="w-full rounded-t-xl"
              poster={attachment.thumbnail_url}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </button>
          <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{attachment.file_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {attachment.duration && <span>{formatDuration(attachment.duration)}</span>}
              <a 
                href={attachment.file_url} 
                download={attachment.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-[280px] sm:max-w-[320px] ${
          isOwn ? "bg-primary/10" : "bg-secondary/50"
        }`}>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              isOwn 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            {/* Audio waveform visualization */}
            <div className="flex items-center gap-0.5 h-6">
              {[...Array(24)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-0.5 sm:w-1 rounded-full transition-all ${
                    isOwn ? "bg-primary" : "bg-primary/60"
                  }`}
                  style={{ 
                    height: `${Math.random() * 100}%`,
                    minHeight: '4px',
                    opacity: i < 8 ? 1 : 0.4
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                {formatDuration(attachment.duration)}
              </span>
              <span>{formatTime(message.created_at)}</span>
            </div>
          </div>
        </div>
      );
    }

    // Generic file - Telegram style
    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-[280px] sm:max-w-xs ${
        isOwn ? "bg-primary/10" : "bg-secondary/50"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
        }`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{attachment.file_name}</p>
          <p className="text-[11px] text-muted-foreground">{attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
        </div>
        <a
          href={attachment.file_url}
          download={attachment.file_name}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-full transition-colors shrink-0 ${
            isOwn 
              ? "text-primary hover:bg-primary/20" 
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  };

  // Check if message is only a sticker/emoji
  const isSticker = message.message_type === "sticker" || (message.content.length <= 4 && /^[\p{Emoji}]+$/u.test(message.content));

  return (
    <div 
      className={`group flex gap-2 sm:gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
      onDoubleClick={() => onReply(message.id)}
    >
      {/* Avatar - only show for others */}
      {!isOwn && (
        <Avatar className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 mt-auto ring-2 ring-background shadow-lg">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/40 to-accent/40 text-foreground text-xs font-semibold">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name - only for others */}
        {!isOwn && (
          <span className="text-xs font-semibold text-primary ml-1 mb-1">
            {profile?.full_name || "Unknown"}
          </span>
        )}

        {/* Reply Reference - Telegram style */}
        {replyToMessage && (
          <div className={`mb-1 w-full ${isOwn ? "pr-1" : "pl-1"}`}>
            <div className={`px-3 py-2 rounded-xl border-l-[3px] ${
              isOwn 
                ? "bg-primary/5 border-primary/50" 
                : "bg-secondary/30 border-accent/50"
            }`}>
              <p className="text-xs font-semibold text-primary truncate">
                {replyToProfile?.full_name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyToMessage.content}</p>
            </div>
          </div>
        )}

        {/* Sticker - large emoji without bubble */}
        {isSticker ? (
          <div className="relative">
            <span className="text-5xl sm:text-6xl">{message.content}</span>
            <div className={`absolute -bottom-1 ${isOwn ? "-left-2" : "-right-2"} flex items-center gap-0.5 bg-card/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-sm`}>
              <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
              {isOwn && <CheckCheck className="w-3 h-3 text-primary" />}
            </div>
          </div>
        ) : attachments.length > 0 && !message.content.includes("Voice message") && message.message_type !== "text" ? (
          // Attachments only (image/video/file)
          <div className="space-y-1">
            {attachments.map((attachment, idx) => (
              <div key={attachment.id}>{renderAttachment(attachment, idx)}</div>
            ))}
          </div>
        ) : (
          // Message Bubble - Telegram style
          <div className={`relative group/bubble ${isOwn ? "telegram-bubble-own" : "telegram-bubble"}`}>
            <div className={`px-3 sm:px-4 py-2 sm:py-2.5 ${
              isOwn 
                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md shadow-lg shadow-primary/20"
                : "bg-secondary/80 backdrop-blur-sm text-foreground rounded-2xl rounded-bl-md shadow-md"
            }`}>
              <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                <span className="text-[10px] sm:text-[11px]">{formatTime(message.created_at)}</span>
                {isOwn && <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/80" />}
              </div>
            </div>
            
            {/* Swipe to reply indicator */}
            <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity ${
              isOwn ? "-left-10" : "-right-10"
            }`}>
              <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h10a4 4 0 0 1 4 4v7" />
                  <polyline points="7 6 3 10 7 14" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Voice/Audio attachments in message */}
        {message.message_type === "audio" && attachments.map((attachment, idx) => (
          <div key={attachment.id} className="mt-1">{renderAttachment(attachment, idx)}</div>
        ))}

        {/* File Preview Modal */}
        {previewFiles.length > 0 && (
          <FilePreviewModal
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            files={previewFiles}
            initialIndex={previewIndex}
          />
        )}

        {/* Reactions */}
        <div className="mt-1">
          <MessageReactions messageId={message.id} />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
