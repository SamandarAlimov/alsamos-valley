import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import AppLayout from "@/components/layout/AppLayout";
import VideoChat from "@/components/VideoChat";
import RealtimeWhiteboard from "@/components/RealtimeWhiteboard";
import ChatMessage from "@/components/ChatMessage";
import ChatInput, { ChatInputRef } from "@/components/ChatInput";
import TaskForm from "@/components/TaskForm";
import RoomSettingsDialog from "@/components/RoomSettingsDialog";
import FileDropZone from "@/components/FileDropZone";
import RoomStatistics from "@/components/RoomStatistics";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare, Users, CheckSquare, Map, BarChart3,
  Plus, ArrowLeft, Sparkles, Settings,
  Video, PenTool, Globe, Lock, UserPlus
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  hub: string;
  room_type: string;
  member_count: number;
  roadmap: unknown;
  budget_estimate: number | null;
  success_score: number | null;
  risk_score: number | null;
  owner_id: string | null;
  privacy?: string;
  invite_code?: string | null;
  require_approval?: boolean;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  message_type?: string;
  reply_to?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: Profile;
}

interface ReplyTo {
  id: string;
  content: string;
  userName: string;
}

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  message_id: string;
}

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = usePresence(roomId);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});
  const [activeTab, setActiveTab] = useState("chat");
  const [loading, setLoading] = useState(true);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const fetchData = async () => {
    if (!roomId) return;

    const [roomRes, messagesRes, tasksRes, membersRes] = await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).single(),
      supabase.from("chat_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true }).limit(100),
      supabase.from("tasks").select("*").eq("room_id", roomId),
      supabase.from("room_members").select("*").eq("room_id", roomId),
    ]);

    if (roomRes.data) setRoom(roomRes.data);
    if (messagesRes.data) {
      setMessages(messagesRes.data);
      
      // Fetch attachments for all messages
      const messageIds = messagesRes.data.map(m => m.id);
      if (messageIds.length > 0) {
        const { data: attachmentsData } = await supabase
          .from("file_attachments")
          .select("*")
          .in("message_id", messageIds);
        
        if (attachmentsData) {
          const attachmentsMap: Record<string, FileAttachment[]> = {};
          attachmentsData.forEach(att => {
            if (!attachmentsMap[att.message_id!]) {
              attachmentsMap[att.message_id!] = [];
            }
            attachmentsMap[att.message_id!].push(att as FileAttachment);
          });
          setAttachments(attachmentsMap);
        }
      }
    }
    if (tasksRes.data) setTasks(tasksRes.data);
    if (membersRes.data) {
      setMembers(membersRes.data);
      
      const userIds = membersRes.data.map(m => m.user_id);
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        
        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profilesMap[p.user_id] = p;
          });
          setProfiles(profilesMap);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = async () => {
    if (!user || !roomId) return;
    
    // Check if room requires approval
    if (room?.require_approval && room.privacy !== "public") {
      // Check for invite code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get("invite");
      
      if (room.privacy === "invite-only" && inviteCode !== room.invite_code) {
        toast({ 
          title: "Invite Required", 
          description: "This room requires a valid invite link to join", 
          variant: "destructive" 
        });
        return;
      }

      // Create join request instead of joining directly
      const { error } = await supabase.from("room_join_requests").insert({
        room_id: roomId,
        user_id: user.id,
        message: "I would like to join this room",
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Request Pending", description: "You've already requested to join this room" });
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Request Sent!", description: "Your request to join has been sent to the room owner" });
        
        if (room.owner_id) {
          await supabase.from("notifications").insert({
            user_id: room.owner_id,
            type: "join_request",
            title: "New join request",
            message: `Someone requested to join "${room.name}"`,
            data: { room_id: roomId },
          });
        }
      }
      return;
    }

    // Check for invite-only rooms without approval
    if (room?.privacy === "invite-only") {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get("invite");
      
      if (inviteCode !== room.invite_code) {
        toast({ 
          title: "Invite Required", 
          description: "This room requires a valid invite link to join", 
          variant: "destructive" 
        });
        return;
      }
    }

    // Check for private rooms
    if (room?.privacy === "private" && !room.require_approval) {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get("invite");
      
      if (inviteCode !== room.invite_code) {
        toast({ 
          title: "Private Room", 
          description: "This is a private room. You need an invite to join.", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    const { error } = await supabase.from("room_members").insert({
      room_id: roomId,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined!", description: "You are now a member of this room" });
      fetchData();
      
      if (room?.owner_id && room.owner_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: room.owner_id,
          type: "room_join",
          title: "New member joined",
          message: `Someone joined your room "${room.name}"`,
          data: { room_id: roomId },
        });
      }
    }
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      const profile = profiles[message.user_id];
      setReplyTo({
        id: message.id,
        content: message.content,
        userName: profile?.full_name || "Unknown",
      });
    }
  };

  const handleFilesDropped = (files: File[]) => {
    if (chatInputRef.current) {
      chatInputRef.current.uploadFiles(files);
    }
  };

  const isMember = members.some(m => m.user_id === user?.id);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getUserProfile = (userId: string) => profiles[userId];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <AppLayout>
        <main className="py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Room not found</h1>
          <Link to="/hubs" className="text-primary mt-4 inline-block">Back to Hubs</Link>
        </main>
      </AppLayout>
    );
  }

  if (showVideoChat) {
    return <VideoChat roomId={roomId!} roomName={room.name} onClose={() => setShowVideoChat(false)} />;
  }

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "whiteboard", label: "Whiteboard", icon: PenTool },
    { id: "roadmap", label: "Roadmap", icon: Map },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const membersWithProfiles = members.map(m => ({
    ...m,
    profile: profiles[m.user_id],
  }));

  return (
    <AppLayout>
      {/* Room Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to={`/hubs/${room.hub}`} className="text-muted-foreground hover:text-foreground shrink-0">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground truncate">{room.name}</h1>
                  {room.privacy === "private" && <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />}
                  {room.privacy === "invite-only" && <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />}
                  {(room.privacy === "public" || !room.privacy) && <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{room.hub} Hub • {members.length} a'zo</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {isMember && (
                <Button variant="glass" size="sm" onClick={() => setShowVideoChat(true)} className="hidden sm:flex">
                  <Video className="w-4 h-4 mr-2" /> Video
                </Button>
              )}
              {isMember && (
                <Button variant="glass" size="icon" onClick={() => setShowVideoChat(true)} className="sm:hidden h-8 w-8">
                  <Video className="w-4 h-4" />
                </Button>
              )}
              {!isMember && user && (
                <Button variant="hero" size="sm" onClick={joinRoom} className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">Qo'shilish</span>
                </Button>
              )}
              {room.owner_id === user?.id && (
                <Button variant="glass" size="icon" onClick={() => setShowSettings(true)} className="h-8 w-8 sm:h-9 sm:w-9">
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3 sm:mt-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-6">
        {/* Chat Tab */}
        {activeTab === "chat" && (
          <FileDropZone onFilesDropped={handleFilesDropped} disabled={!isMember} className="h-[calc(100vh-220px)] sm:h-[calc(100vh-280px)]">
            <div className="glass-card rounded-xl sm:rounded-2xl flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-sm sm:text-base">Hali xabarlar yo'q. Suhbatni boshlang!</p>
                    {isMember && <p className="text-xs sm:text-sm mt-2">Fayllarni ulashish uchun bu yerga tashlang</p>}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const profile = getUserProfile(msg.user_id);
                    const isOwn = msg.user_id === user?.id;
                    const replyToMessage = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
                    const replyToProfile = replyToMessage ? getUserProfile(replyToMessage.user_id) : undefined;
                    
                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        profile={profile}
                        isOwn={isOwn}
                        replyToMessage={replyToMessage}
                        replyToProfile={replyToProfile}
                        attachments={attachments[msg.id] || []}
                        onReply={handleReply}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {isMember ? (
                <ChatInput
                  ref={chatInputRef}
                  roomId={roomId!}
                  replyTo={replyTo}
                  onClearReply={() => setReplyTo(null)}
                  onMessageSent={fetchData}
                />
              ) : (
                <div className="p-4 border-t border-border/50 text-center">
                  <p className="text-muted-foreground text-sm">Join this room to participate in chat</p>
                </div>
              )}
            </div>
          </FileDropZone>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <h2 className="font-display font-semibold text-lg sm:text-xl text-foreground">Vazifalar</h2>
              {isMember && (
                <Button variant="glass" size="sm" onClick={() => setShowTaskForm(true)} className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">Qo'shish</span>
                </Button>
              )}
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <CheckSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">Hali vazifalar yo'q</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tasks.map((task) => {
                  const assignee = task.assigned_to ? profiles[task.assigned_to] : null;
                  return (
                    <div key={task.id} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            task.priority === "high" ? "bg-red-500" :
                            task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                          <div>
                            <h4 className="font-medium text-foreground">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.status === "done" ? "bg-green-500/10 text-green-500" :
                          task.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      {assignee && (
                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(assignee.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{assignee.full_name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-4 sm:mb-6">A'zolar</h2>
            <div className="grid gap-2 sm:gap-3">
              {membersWithProfiles.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs sm:text-sm">{getInitials(member.profile?.full_name)}</AvatarFallback>
                      </Avatar>
                      {isOnline(member.user_id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">{member.profile?.full_name || "Noma'lum"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Whiteboard Tab */}
        {activeTab === "whiteboard" && (
          <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden h-[calc(100vh-220px)] sm:h-[calc(100vh-280px)]">
            <RealtimeWhiteboard roomId={roomId!} />
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === "roadmap" && (
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-4 sm:mb-6">Yo'l xaritasi</h2>
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Map className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base">Tez orada</p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <RoomStatistics 
            roomId={roomId!} 
            members={members.map(m => ({ user_id: m.user_id, role: m.role, joined_at: m.joined_at }))}
            profiles={profiles}
          />
        )}
      </div>

      {/* Task Form Dialog */}
      {showTaskForm && (
        <TaskForm
          roomId={roomId!}
          members={membersWithProfiles}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={() => {
            setShowTaskForm(false);
            fetchData();
          }}
        />
      )}

      {/* Settings Dialog */}
      <RoomSettingsDialog
        room={room}
        open={showSettings}
        onOpenChange={setShowSettings}
        onRoomUpdated={fetchData}
      />
    </AppLayout>
  );
};

export default RoomPage;