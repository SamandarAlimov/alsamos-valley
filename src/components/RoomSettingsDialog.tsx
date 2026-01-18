import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trash2, Save, Loader2, Copy, RefreshCw, Link2, 
  Users, Shield, Settings2, Globe, Lock, UserPlus,
  Check, X, Crown, ShieldCheck, User
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  hub: string;
  privacy?: string;
  invite_code?: string | null;
  require_approval?: boolean;
  owner_id?: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface RoomSettingsDialogProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomUpdated: () => void;
}

const RoomSettingsDialog = ({ room, open, onOpenChange, onRoomUpdated }: RoomSettingsDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || "");
  const [privacy, setPrivacy] = useState(room.privacy || "public");
  const [requireApproval, setRequireApproval] = useState(room.require_approval || false);
  const [inviteCode, setInviteCode] = useState(room.invite_code || "");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(room.name);
      setDescription(room.description || "");
      setPrivacy(room.privacy || "public");
      setRequireApproval(room.require_approval || false);
      setInviteCode(room.invite_code || "");
      fetchMembers();
      fetchJoinRequests();
    }
  }, [open, room]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data: membersData } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", room.id);

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const membersWithProfiles = membersData.map(m => ({
        ...m,
        profile: profilesMap.get(m.user_id),
      }));
      setMembers(membersWithProfiles);
    } else {
      setMembers([]);
    }
    setLoadingMembers(false);
  };

  const fetchJoinRequests = async () => {
    const { data: requests } = await supabase
      .from("room_join_requests")
      .select("*")
      .eq("room_id", room.id)
      .eq("status", "pending");

    if (requests && requests.length > 0) {
      const userIds = requests.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const requestsWithProfiles = requests.map(r => ({
        ...r,
        profile: profilesMap.get(r.user_id),
      }));
      setJoinRequests(requestsWithProfiles);
    } else {
      setJoinRequests([]);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${room.id}?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Invite link copied to clipboard" });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Room name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("rooms")
      .update({ 
        name: name.trim(), 
        description: description.trim(),
        privacy,
        require_approval: requireApproval,
        invite_code: inviteCode || null,
      })
      .eq("id", room.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Room updated successfully" });
      onRoomUpdated();
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    await Promise.all([
      supabase.from("room_members").delete().eq("room_id", room.id),
      supabase.from("chat_messages").delete().eq("room_id", room.id),
      supabase.from("tasks").delete().eq("room_id", room.id),
      supabase.from("room_join_requests").delete().eq("room_id", room.id),
    ]);

    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    
    setDeleting(false);
    setShowDeleteConfirm(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Room has been deleted" });
      navigate("/hubs");
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === room.owner_id) {
      toast({ title: "Error", description: "Cannot remove room owner", variant: "destructive" });
      return;
    }
    
    setRemovingMember(memberId);
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Member has been removed from the room" });
      fetchMembers();
      onRoomUpdated();
    }
    setRemovingMember(null);
  };

  const handleUpdateRole = async (memberId: string, userId: string, newRole: string) => {
    if (userId === room.owner_id) {
      toast({ title: "Error", description: "Cannot change owner's role", variant: "destructive" });
      return;
    }

    setUpdatingRole(memberId);
    const { error } = await supabase
      .from("room_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Role changed to ${newRole}` });
      fetchMembers();
    }
    setUpdatingRole(null);
  };

  const handleJoinRequest = async (requestId: string, userId: string, approved: boolean) => {
    if (approved) {
      // Add to room members
      await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: userId,
        role: "member",
      });
    }

    await supabase
      .from("room_join_requests")
      .update({ 
        status: approved ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    toast({ 
      title: approved ? "Approved" : "Rejected", 
      description: `Join request has been ${approved ? "approved" : "rejected"}` 
    });
    
    fetchJoinRequests();
    if (approved) {
      fetchMembers();
      onRoomUpdated();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin": return <ShieldCheck className="w-4 h-4 text-primary" />;
      case "moderator": return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Room Settings
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Invite</TabsTrigger>
              <TabsTrigger value="members">
                Members ({members.length})
                {joinRequests.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {joinRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter room name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-description">Description</Label>
                <Textarea
                  id="room-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your room..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Room
                </Button>
                
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6 py-4">
              <div className="space-y-4">
                <Label>Room Privacy</Label>
                <div className="grid gap-3">
                  {[
                    { id: "public", icon: Globe, label: "Public", desc: "Anyone can find and join this room" },
                    { id: "private", icon: Lock, label: "Private", desc: "Only invited members can join" },
                    { id: "invite-only", icon: UserPlus, label: "Invite Only", desc: "Requires an invite link to join" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPrivacy(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        privacy === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className={`w-5 h-5 ${privacy === option.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-medium text-foreground">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {(privacy === "private" || privacy === "invite-only") && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Require Approval</Label>
                      <Switch
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, join requests will need owner approval before members can join.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Invite Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={inviteCode ? `${window.location.origin}/room/${room.id}?invite=${inviteCode}` : ""}
                        readOnly
                        placeholder="Generate an invite link..."
                        className="text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={generateInviteCode}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      {inviteCode && (
                        <Button variant="outline" size="icon" onClick={copyInviteLink}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {inviteCode && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Share this link with people you want to invite
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 py-4">
              {/* Join Requests */}
              {joinRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Pending Requests ({joinRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={request.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(request.profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {request.profile?.full_name || "Unknown User"}
                            </p>
                            {request.message && (
                              <p className="text-xs text-muted-foreground">{request.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleJoinRequest(request.id, request.user_id, false)}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleJoinRequest(request.id, request.user_id, true)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Members */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Current Members ({members.length})
                </h3>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {member.profile?.full_name || "Unknown User"}
                            </p>
                            {getRoleIcon(member.role)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.user_id !== room.owner_id && (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleUpdateRole(member.id, member.user_id, value)}
                                disabled={updatingRole === member.id}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveMember(member.id, member.user_id)}
                                disabled={removingMember === member.id}
                              >
                                {removingMember === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                          {member.user_id === room.owner_id && (
                            <span className="text-xs text-yellow-500 font-medium">Owner</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{room.name}"? This will permanently remove all messages, tasks, and members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoomSettingsDialog;
