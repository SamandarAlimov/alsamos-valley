import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, Paperclip, Mic, Smile, X, 
  StopCircle, Loader2, Image as ImageIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ReplyTo {
  id: string;
  content: string;
  userName: string;
}

interface ChatInputProps {
  roomId: string;
  replyTo?: ReplyTo | null;
  onClearReply: () => void;
  onMessageSent: () => void;
}

export interface ChatInputRef {
  uploadFiles: (files: File[]) => Promise<void>;
}

const STICKERS = ["👍", "❤️", "😂", "🎉", "🚀", "💡", "🔥", "👏", "💪", "🙌", "✨", "⚡", "🎯", "💎", "🌟", "🤝"];

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ roomId, replyTo, onClearReply, onMessageSent }, ref) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = async (content: string, type: string = "text", attachments: string[] = []) => {
    if (!user || !roomId) return;

    setSending(true);
    try {
      const { data: msgData, error } = await supabase.from("chat_messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: content.trim(),
        message_type: type,
        reply_to: replyTo?.id || null,
      }).select().single();

      if (error) throw error;

      if (attachments.length > 0 && msgData) {
        for (const url of attachments) {
          const fileName = url.split("/").pop() || "file";
          const fileType = getFileType(fileName);
          await supabase.from("file_attachments").insert({
            message_id: msgData.id,
            user_id: user.id,
            file_name: fileName,
            file_type: fileType,
            file_size: 0,
            file_url: url,
          });
        }
      }

      setMessage("");
      onClearReply();
      onMessageSent();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send message";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const types: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
      mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
      mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
      pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return types[ext] || "application/octet-stream";
  };

  const uploadFilesInternal = async (files: File[]) => {
    if (!files.length || !user) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("chat-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-files")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      const isMedia = files[0].type.startsWith("image/") || files[0].type.startsWith("video/");
      await sendMessage(files[0].name, isMedia ? "media" : "file", uploadedUrls);
      toast({ title: "✓ Yuklandi", description: `${files.length} fayl yuborildi` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFilesInternal(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  useImperativeHandle(ref, () => ({
    uploadFiles: uploadFilesInternal,
  }));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        if (!user) return;
        
        setUploading(true);
        try {
          const fileName = `${user.id}/${Date.now()}-voice.webm`;
          const { error: uploadError } = await supabase.storage
            .from("chat-files")
            .upload(fileName, audioBlob);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("chat-files")
            .getPublicUrl(fileName);

          await sendMessage("Voice message", "audio", [urlData.publicUrl]);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "Failed to send voice message";
          toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
          setUploading(false);
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ 
        title: "Mikrofon xatosi", 
        description: "Iltimos, mikrofondan foydalanishga ruxsat bering", 
        variant: "destructive" 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
  };

  const handleSubmit = () => {
    if (!message.trim()) return;
    sendMessage(message, "text");
  };

  const sendSticker = (sticker: string) => {
    sendMessage(sticker, "sticker");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-t border-border/30 bg-card/50 backdrop-blur-xl">
      {/* Reply Preview - Telegram style */}
      {replyTo && (
        <div className="px-3 sm:px-4 pt-2 sm:pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border-l-[3px] border-primary">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">
                {replyTo.userName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <button 
              onClick={onClearReply} 
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recording State */}
      {isRecording && (
        <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
          <button 
            onClick={cancelRecording}
            className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-foreground">{formatRecordingTime(recordingTime)}</span>
            
            {/* Waveform animation */}
            <div className="flex items-center gap-0.5 flex-1">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{ 
                    height: `${Math.random() * 20 + 8}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={stopRecording}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Normal Input State */}
      {!isRecording && (
        <div className="px-2 sm:px-3 py-2 sm:py-3 flex items-end gap-1 sm:gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="*/*"
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Attachment Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </Button>

          {/* Message Input Container */}
          <div className="flex-1 flex items-end bg-secondary/60 backdrop-blur-sm rounded-2xl px-2 sm:px-3 py-1.5 gap-1 sm:gap-2 min-h-[44px]">
            {/* Emoji/Sticker Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80 p-3" align="start" side="top">
                <div className="grid grid-cols-8 gap-1">
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker}
                      onClick={() => sendSticker(sticker)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-secondary rounded-lg transition-colors hover:scale-110"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm sm:text-[15px] text-foreground placeholder:text-muted-foreground max-h-[120px] py-2 leading-5"
              disabled={sending}
            />

            {/* Image Button */}
            <button 
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Send or Voice Button */}
          {message.trim() ? (
            <Button 
              onClick={handleSubmit} 
              disabled={sending}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          ) : (
            <Button 
              variant="ghost"
              size="icon"
              onClick={startRecording}
              disabled={uploading}
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
