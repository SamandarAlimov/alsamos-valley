import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebRTC } from "@/hooks/useWebRTC";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, 
  Users, Maximize2, Minimize2, Settings
} from "lucide-react";

interface VideoChatProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

const VideoChat = ({ roomId, roomName, onClose }: VideoChatProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    localStream,
    participants,
    isConnected,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    replaceVideoTrack,
  } = useWebRTC({
    roomId,
    onParticipantJoin: (userId) => {
      toast({
        title: "Participant Joined",
        description: "A new participant has joined the call",
      });
    },
    onParticipantLeave: (userId) => {
      toast({
        title: "Participant Left",
        description: "A participant has left the call",
      });
    },
  });

  // Update local video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleStartCall = async () => {
    setIsConnecting(true);
    try {
      await startCall();
      toast({
        title: "Connected to Video Call",
        description: `You are now in ${roomName} video room`,
      });
    } catch (error) {
      toast({
        title: "Camera Access Error",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndCall = async () => {
    await endCall();
    onClose();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    toggleMute(newMuted);
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    toggleVideo(newVideoOff);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = stream.getVideoTracks()[0];
        await replaceVideoTrack(newVideoTrack);
        setIsScreenSharing(false);
      } catch {
        console.error("Failed to restore camera");
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            replaceVideoTrack(stream.getVideoTracks()[0]);
          });
        };
        
        await replaceVideoTrack(screenTrack);
        setIsScreenSharing(true);
      } catch {
        toast({
          title: "Screen Share Error",
          description: "Failed to start screen sharing",
          variant: "destructive",
        });
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const participantCount = participants.size + (isConnected ? 1 : 0);
  const participantArray = Array.from(participants.values());

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">{roomName}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid gap-4 h-full ${
          participantCount <= 1 ? "grid-cols-1" :
          participantCount === 2 ? "grid-cols-1 lg:grid-cols-2" :
          participantCount <= 4 ? "grid-cols-2" :
          participantCount <= 6 ? "grid-cols-2 lg:grid-cols-3" :
          "grid-cols-2 lg:grid-cols-4"
        }`}>
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-secondary/50 flex items-center justify-center min-h-[200px]">
            {isConnected ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center">
                      <VideoOff className="w-10 h-10 text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-sm text-white flex items-center gap-2">
                  <span>You</span>
                  {isMuted && <MicOff className="w-3.5 h-3.5" />}
                  {isScreenSharing && <Monitor className="w-3.5 h-3.5" />}
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Camera preview will appear here</p>
                <Button 
                  variant="hero" 
                  onClick={handleStartCall}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Join Video Call"}
                </Button>
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {participantArray.map((participant) => (
            <div 
              key={participant.userId}
              className="relative rounded-2xl overflow-hidden bg-secondary/50 flex items-center justify-center min-h-[200px]"
            >
              {participant.stream ? (
                <RemoteVideo stream={participant.stream} username={participant.username} />
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">{participant.username}</p>
                  <p className="text-muted-foreground text-xs">Connecting...</p>
                </div>
              )}
            </div>
          ))}

          {/* Empty slots when no remote participants */}
          {isConnected && participantArray.length === 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-secondary/50 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Waiting for others to join...</p>
                <p className="text-muted-foreground text-sm mt-1">Share this room link to invite participants</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {isConnected && (
        <div className="flex items-center justify-center gap-3 px-4 py-4 bg-card border-t border-border">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={handleToggleMute}
            className="w-14 h-14 rounded-full p-0"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            variant={isVideoOff ? "destructive" : "outline"}
            size="lg"
            onClick={handleToggleVideo}
            className="w-14 h-14 rounded-full p-0"
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="lg"
            onClick={handleToggleScreenShare}
            className="w-14 h-14 rounded-full p-0"
          >
            <Monitor className="w-6 h-6" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full p-0"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Separate component for remote video to handle srcObject properly
const RemoteVideo = ({ stream, username }: { stream: MediaStream; username: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-sm text-white">
        {username}
      </div>
    </>
  );
};

export default VideoChat;
