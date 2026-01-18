import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PresenceState {
  [key: string]: {
    online: boolean;
    lastSeen: string;
  };
}

export const usePresence = (roomId?: string) => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<PresenceState>({});

  // Update user's last_seen in database
  const updateLastSeen = useCallback(async () => {
    if (!user?.id) return;
    
    await supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("user_id", user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Update last_seen on mount and every 30 seconds
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);

    // Set up presence channel
    const channelName = roomId ? `presence:room:${roomId}` : "presence:global";
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const newPresence: PresenceState = {};
        
        Object.keys(state).forEach((userId) => {
          newPresence[userId] = {
            online: true,
            lastSeen: new Date().toISOString(),
          };
        });
        
        setPresence(newPresence);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setPresence((prev) => ({
          ...prev,
          [key]: { online: true, lastSeen: new Date().toISOString() },
        }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setPresence((prev) => ({
          ...prev,
          [key]: { online: false, lastSeen: new Date().toISOString() },
        }));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ 
            user_id: user.id, 
            online_at: new Date().toISOString() 
          });
        }
      });

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user?.id, roomId, updateLastSeen]);

  const isOnline = useCallback((userId: string) => {
    return presence[userId]?.online ?? false;
  }, [presence]);

  const getLastSeen = useCallback((userId: string) => {
    return presence[userId]?.lastSeen;
  }, [presence]);

  return { presence, isOnline, getLastSeen };
};
