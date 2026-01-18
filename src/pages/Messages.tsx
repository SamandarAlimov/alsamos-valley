import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Send, 
  Search, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
  Image as ImageIcon,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_seen: string | null;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user?: Profile;
  unread_count?: number;
  last_message?: string;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  read: boolean;
  created_at: string;
}

const STICKERS = ["😀", "😂", "🥰", "😎", "🤔", "👍", "❤️", "🔥", "🎉", "💯", "🙏", "😢"];

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConversations();

    const channel = supabase
      .channel("dm-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        () => {
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convos, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    const enrichedConvos = await Promise.all(
      (convos || []).map(async (convo) => {
        const otherUserId = convo.participant_one === user.id 
          ? convo.participant_two 
          : convo.participant_one;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", otherUserId)
          .single();

        const { data: lastMsg } = await supabase
          .from("direct_messages")
          .select("content")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .eq("read", false)
          .neq("sender_id", user.id);

        return {
          ...convo,
          other_user: profile,
          last_message: lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enrichedConvos);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);

    if (user) {
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("full_name", `%${query}%`)
      .neq("user_id", user?.id)
      .limit(10);

    if (!error) {
      setSearchResults(data || []);
    }
  };

  const startConversation = async (otherUser: Profile) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_one.eq.${user.id},participant_two.eq.${otherUser.user_id}),and(participant_one.eq.${otherUser.user_id},participant_two.eq.${user.id})`
      )
      .single();

    if (existing) {
      setSelectedConversation({ ...existing, other_user: otherUser });
      fetchMessages(existing.id);
    } else {
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          participant_one: user.id,
          participant_two: otherUser.user_id,
        })
        .select()
        .single();

      if (!error && newConvo) {
        setSelectedConversation({ ...newConvo, other_user: otherUser });
        fetchConversations();
      }
    }

    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !selectedConversation || !user) return;

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: messageContent,
      message_type: "text",
    });

    if (!error) {
      setNewMessage("");
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    }
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000;
  };

  const formatMessageTime = (date: string) => {
    return format(new Date(date), "HH:mm");
  };

  const formatConversationTime = (date: string) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) {
      return format(msgDate, "HH:mm");
    } else if (isYesterday(msgDate)) {
      return "Kecha";
    }
    return format(msgDate, "dd.MM.yy");
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col">
        {/* Telegram-style Messages Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div 
            className={`w-full md:w-[380px] lg:w-[420px] bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col ${
              selectedConversation ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Xabarlar
                </h1>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                    searchUsers(e.target.value);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="pl-10 bg-secondary/50 border-0 rounded-full h-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setIsSearching(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {isSearching && searchQuery.length > 0 ? (
                <div className="py-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => startConversation(profile)}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-primary/10 transition-all duration-200"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                              {profile.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline(profile.last_seen) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold">{profile.full_name || "Anonim"}</p>
                          <p className="text-sm text-muted-foreground">
                            {isOnline(profile.last_seen) ? "online" : "offline"}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Foydalanuvchi topilmadi</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {conversations.length > 0 ? (
                    conversations.map((convo) => (
                      <button
                        key={convo.id}
                        onClick={() => {
                          setSelectedConversation(convo);
                          fetchMessages(convo.id);
                        }}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all duration-200 ${
                          selectedConversation?.id === convo.id 
                            ? "bg-primary/15" 
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={convo.other_user?.avatar_url || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/40 text-primary-foreground font-semibold">
                              {convo.other_user?.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline(convo.other_user?.last_seen || null) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">
                              {convo.other_user?.full_name || "Anonim"}
                            </p>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {convo.last_message_at && formatConversationTime(convo.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-sm text-muted-foreground truncate pr-2">
                              {convo.last_message || "Xabarlar yo'q"}
                            </p>
                            {convo.unread_count && convo.unread_count > 0 ? (
                              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                {convo.unread_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MessageCircle className="h-10 w-10 text-primary/60" />
                      </div>
                      <h3 className="font-semibold mb-1">Suhbatlar yo'q</h3>
                      <p className="text-sm text-muted-foreground px-8">
                        Yangi suhbat boshlash uchun foydalanuvchilarni qidiring
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div 
            className={`flex-1 flex flex-col bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] ${
              !selectedConversation ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-3 sm:px-4 py-2.5 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full h-9 w-9"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={selectedConversation.other_user?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                      {selectedConversation.other_user?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {selectedConversation.other_user?.full_name || "Anonim"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isOnline(selectedConversation.other_user?.last_seen || null)
                        ? "online"
                        : selectedConversation.other_user?.last_seen
                        ? `so'nggi marta ${formatDistanceToNow(new Date(selectedConversation.other_user.last_seen), { addSuffix: true })}`
                        : "offline"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hidden sm:flex">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hidden sm:flex">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-2 sm:px-4 py-3">
                  <div className="max-w-3xl mx-auto space-y-1">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user.id;
                      const showTime = index === 0 || 
                        new Date(messages[index - 1].created_at).getTime() < new Date(msg.created_at).getTime() - 300000;
                      
                      return (
                        <div key={msg.id}>
                          {showTime && (
                            <div className="flex justify-center my-3">
                              <span className="px-3 py-1 bg-background/60 backdrop-blur-sm rounded-full text-xs text-muted-foreground">
                                {isToday(new Date(msg.created_at)) 
                                  ? "Bugun" 
                                  : isYesterday(new Date(msg.created_at))
                                  ? "Kecha"
                                  : format(new Date(msg.created_at), "d MMMM")}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-0.5`}>
                            <div
                              className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 ${
                                isOwn
                                  ? "telegram-bubble-own bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                                  : "telegram-bubble bg-card"
                              }`}
                            >
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              <div className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5 ${
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                <span className="text-[11px]">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {isOwn && (
                                  msg.read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="bg-card/80 backdrop-blur-xl border-t border-border/50 px-2 sm:px-4 py-2">
                  {isRecording ? (
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10 text-destructive"
                        onClick={() => setIsRecording(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      
                      <div className="flex-1 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-sm">{formatRecordingTime(recordingTime)}</span>
                        <div className="flex-1 flex items-center gap-0.5 h-8">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-primary/60 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 50}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
                        onClick={() => {
                          setIsRecording(false);
                          sendMessage("🎤 Ovozli xabar");
                        }}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1 sm:gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 flex-shrink-0">
                            <Smile className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" side="top" align="start">
                          <div className="grid grid-cols-6 gap-1">
                            {STICKERS.map((sticker) => (
                              <button
                                key={sticker}
                                onClick={() => sendMessage(sticker)}
                                className="p-2 text-2xl hover:bg-secondary rounded-lg transition-colors"
                              >
                                {sticker}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 flex-shrink-0 hidden sm:flex">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      
                      <div className="flex-1 relative">
                        <textarea
                          ref={inputRef}
                          placeholder="Xabar yozish..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={1}
                          className="w-full px-4 py-2.5 bg-secondary/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-[15px] max-h-32 overflow-y-auto"
                          style={{ minHeight: "44px" }}
                        />
                      </div>
                      
                      {newMessage.trim() ? (
                        <Button
                          size="icon"
                          className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 flex-shrink-0"
                          onClick={() => sendMessage()}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-10 w-10 flex-shrink-0"
                          onClick={() => setIsRecording(true)}
                        >
                          <Mic className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-primary/60" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Suhbatni tanlang</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Mavjud suhbatlardan birini tanlang yoki yangi suhbat boshlash uchun foydalanuvchi qidiring
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
