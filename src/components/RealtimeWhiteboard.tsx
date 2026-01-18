import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Pencil, Eraser, Square, Circle, Undo2, Redo2, 
  Download, Trash2, Palette, Minus, Plus, MousePointer2,
  Users
} from "lucide-react";

interface WhiteboardProps {
  roomId: string;
}

type Tool = "select" | "pencil" | "eraser" | "rectangle" | "circle";

interface DrawElement {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  userId: string;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

const COLORS = [
  "#ffffff", "#ef4444", "#f97316", "#eab308", 
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"
];

const USER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899"];

const RealtimeWhiteboard = ({ roomId }: WhiteboardProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [history, setHistory] = useState<DrawElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [participantCount, setParticipantCount] = useState(1);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

  // Set up realtime channel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`whiteboard:${roomId}`, {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    // Handle presence
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setParticipantCount(Object.keys(state).length);
    });

    // Handle drawing events
    channel.on("broadcast", { event: "draw" }, ({ payload }) => {
      if (payload.userId !== user.id) {
        setElements((prev) => {
          const exists = prev.some((el) => el.id === payload.element.id);
          if (exists) {
            return prev.map((el) => el.id === payload.element.id ? payload.element : el);
          }
          return [...prev, payload.element];
        });
      }
    });

    // Handle cursor movements
    channel.on("broadcast", { event: "cursor" }, ({ payload }) => {
      if (payload.userId !== user.id) {
        setCursors((prev) => {
          const newMap = new Map(prev);
          newMap.set(payload.userId, payload);
          return newMap;
        });
      }
    });

    // Handle clear
    channel.on("broadcast", { event: "clear" }, () => {
      setElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: user.id });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id]);

  const broadcastDraw = useCallback((element: DrawElement) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "draw",
        payload: { element, userId: user?.id },
      });
    }
  }, [user?.id]);

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (channelRef.current && user?.id) {
      channelRef.current.send({
        type: "broadcast",
        event: "cursor",
        payload: { x, y, userId: user.id, userName: "User", color: userColor },
      });
    }
  }, [user?.id, userColor]);

  const broadcastClear = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "clear",
        payload: {},
      });
    }
  }, []);

  const saveToHistory = useCallback((newElements: DrawElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    saveToHistory([]);
    broadcastClear();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    broadcastCursor(pos.x, pos.y);
    
    if (!isDrawing || !currentElement) return;

    if (tool === "pencil" || tool === "eraser") {
      const updated = {
        ...currentElement,
        points: [...(currentElement.points || []), { x: pos.x, y: pos.y }],
      };
      setCurrentElement(updated);
      broadcastDraw(updated);
    } else if (tool === "rectangle" || tool === "circle") {
      const updated = {
        ...currentElement,
        width: pos.x - startPos.x,
        height: pos.y - startPos.y,
      };
      setCurrentElement(updated);
      broadcastDraw(updated);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select" || !user?.id) return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    const newElement: DrawElement = {
      id: `${user.id}-${Date.now()}`,
      type: tool,
      x: pos.x,
      y: pos.y,
      color: tool === "eraser" ? "#0a0a0f" : color,
      strokeWidth: tool === "eraser" ? 20 : strokeWidth,
      points: tool === "pencil" || tool === "eraser" ? [{ x: pos.x, y: pos.y }] : undefined,
      userId: user.id,
    };

    setCurrentElement(newElement);
    broadcastDraw(newElement);
  };

  const stopDrawing = () => {
    if (isDrawing && currentElement) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      saveToHistory(newElements);
    }
    setIsDrawing(false);
    setCurrentElement(null);
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all elements
    const allElements = currentElement ? [...elements, currentElement] : elements;
    
    allElements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "pencil" || el.type === "eraser") {
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          el.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      } else if (el.type === "rectangle") {
        ctx.strokeRect(el.x, el.y, el.width || 0, el.height || 0);
      } else if (el.type === "circle") {
        const radiusX = Math.abs((el.width || 0) / 2);
        const radiusY = Math.abs((el.height || 0) / 2);
        const centerX = el.x + (el.width || 0) / 2;
        const centerY = el.y + (el.height || 0) / 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw remote cursors
    cursors.forEach((cursor) => {
      ctx.fillStyle = cursor.color;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(cursor.userName, cursor.x + 10, cursor.y - 5);
    });
  }, [elements, currentElement, cursors]);

  // Resize canvas
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
  ];

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-card border-b border-border">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTool(t.id as Tool)}
              title={t.label}
            >
              <t.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-8 text-center">{strokeWidth}px</span>
          <Button variant="ghost" size="sm" onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50 mr-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{participantCount}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadCanvas}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default RealtimeWhiteboard;
