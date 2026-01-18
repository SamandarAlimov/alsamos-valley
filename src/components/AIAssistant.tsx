import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, Minimize2, Maximize2, User, Bot, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salom! Men ALSA, Alsamos Valley sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          context: "User exploring Alsamos Valley platform",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Hozirda juda ko'p so'rovlar bor. Iltimos, biroz kutib turing." }]);
          return;
        }
        if (response.status === 402) {
          setMessages((prev) => [...prev, { role: "assistant", content: "AI kreditlari tugadi. Iltimos, support bilan bog'laning." }]);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
                  return updated;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko'ring." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating button - positioned to not interfere with messages
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 rounded-full bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center shadow-lg hover:scale-110 transition-all button-glow group ${
          isMobile 
            ? "bottom-20 right-4 w-12 h-12" // Above mobile nav, smaller
            : "bottom-6 right-6 w-14 h-14"
        }`}
        aria-label="AI Assistant"
      >
        <Sparkles className={`text-white ${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
        {/* Tooltip for desktop */}
        {!isMobile && (
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            AI Yordamchi
          </span>
        )}
      </button>
    );
  }

  // Chat window sizing based on device
  const chatWindowClasses = isMobile
    ? isExpanded
      ? "fixed inset-0 z-50" // Fullscreen on mobile when expanded
      : "fixed bottom-0 left-0 right-0 z-50 h-[70vh] rounded-t-2xl" // Bottom sheet on mobile
    : isExpanded
      ? "fixed bottom-6 right-6 z-50 w-[500px] h-[600px] rounded-2xl" // Larger on desktop
      : "fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[450px] rounded-2xl"; // Normal on desktop

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`${chatWindowClasses} bg-card border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? "!h-14" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyber-blue/20 to-neon-purple/20 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-foreground">ALSA</h3>
              <p className="text-xs text-muted-foreground">AI Yordamchi</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                title={isExpanded ? "Kichiklashtirish" : "Kattalashtirish"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" 
                      ? "bg-secondary" 
                      : "bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30"
                  }`}>
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}>
                    {msg.content || (isLoading && index === messages.length - 1 ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-100" />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-200" />
                      </span>
                    ) : "")}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0 bg-card">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Savolingizni yozing..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                  autoFocus={isMobile}
                />
                <Button size="sm" onClick={sendMessage} disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AIAssistant;
