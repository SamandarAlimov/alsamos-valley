import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  userId: string;
  username: string;
  stream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
}

export type { Participant };

interface UseWebRTCProps {
  roomId: string;
  onParticipantJoin?: (userId: string) => void;
  onParticipantLeave?: (userId: string) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useWebRTC = ({ roomId, onParticipantJoin, onParticipantLeave }: UseWebRTCProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    console.log(`Creating peer connection for ${remoteUserId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current) {
        console.log(`Sending ICE candidate to ${remoteUserId}`);
        await channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            candidate: event.candidate,
            from: user?.id,
            to: remoteUserId,
          },
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${remoteUserId}`);
      const [remoteStream] = event.streams;
      setParticipants((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(remoteUserId);
        newMap.set(remoteUserId, {
          userId: remoteUserId,
          username: existing?.username || "Participant",
          stream: remoteStream,
          peerConnection: pc,
        });
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${remoteUserId}: ${pc.connectionState}`);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        handleParticipantLeave(remoteUserId);
      }
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [user?.id]);

  const handleParticipantLeave = useCallback((userId: string) => {
    console.log(`Participant leaving: ${userId}`);
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    setParticipants((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
    onParticipantLeave?.(userId);
  }, [onParticipantLeave]);

  const createOffer = useCallback(async (remoteUserId: string) => {
    const pc = createPeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log(`Sending offer to ${remoteUserId}`);
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "offer",
        payload: {
          sdp: offer,
          from: user?.id,
          to: remoteUserId,
        },
      });
    }
  }, [createPeerConnection, user?.id]);

  const handleOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    console.log(`Received offer from ${fromUserId}`);
    const pc = createPeerConnection(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    console.log(`Sending answer to ${fromUserId}`);
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "answer",
        payload: {
          sdp: answer,
          from: user?.id,
          to: fromUserId,
        },
      });
    }
  }, [createPeerConnection, user?.id]);

  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    console.log(`Received answer from ${fromUserId}`);
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    console.log(`Received ICE candidate from ${fromUserId}`);
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Set up signaling channel
      const channel = supabase.channel(`video-room:${roomId}`, {
        config: {
          presence: { key: user.id },
        },
      });

      channelRef.current = channel;

      // Handle presence for participant discovery
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        console.log("Presence sync:", state);
      });

      channel.on("presence", { event: "join" }, async ({ key, newPresences }) => {
        console.log("Participant joined:", key, newPresences);
        if (key !== user.id) {
          // New participant joined, create offer
          onParticipantJoin?.(key);
          await createOffer(key);
        }
      });

      channel.on("presence", { event: "leave" }, ({ key }) => {
        console.log("Participant left:", key);
        if (key !== user.id) {
          handleParticipantLeave(key);
        }
      });

      // Handle WebRTC signaling messages
      channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.to === user.id) {
          await handleOffer(payload.from, payload.sdp);
        }
      });

      channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.to === user.id) {
          await handleAnswer(payload.from, payload.sdp);
        }
      });

      channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.to === user.id) {
          await handleIceCandidate(payload.from, payload.candidate);
        }
      });

      // Subscribe and announce presence
      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, joined_at: new Date().toISOString() });
          setIsConnected(true);
          console.log("Subscribed to video room channel");
        }
      });
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }, [roomId, user?.id, createOffer, handleOffer, handleAnswer, handleIceCandidate, handleParticipantLeave, onParticipantJoin]);

  const endCall = useCallback(async () => {
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Unsubscribe from channel
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setLocalStream(null);
    setParticipants(new Map());
    setIsConnected(false);
  }, []);

  const toggleMute = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, []);

  const toggleVideo = useCallback((off: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !off;
      });
    }
  }, []);

  const replaceVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    peerConnectionsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });

    if (localStreamRef.current) {
      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    participants,
    isConnected,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    replaceVideoTrack,
  };
};
