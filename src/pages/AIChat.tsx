import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salom! Men ALSA, Alsamos Valley sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman? Startaplar, investorlar, tadbirlar yoki platformaning boshqa xususiyatlari haqida so'rang!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "Salom! Men ALSA, Alsamos Valley sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman?" }
    ]);
  };

  const suggestedQuestions = [
    "Startap qanday ro'yxatdan o'tkazaman?",
    "Investorlar bilan qanday bog'lanaman?",
    "Tadbirlarga qanday qatnashaman?",
    "Mentorlik dasturi haqida gapirib bering",
  ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">ALSA</h1>
                <p className="text-sm text-muted-foreground">Alsamos Valley AI Yordamchisi</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tozalash</span>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex gap-3",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  msg.role === "user" 
                    ? "bg-primary/10" 
                    : "bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20"
                )}>
                  {msg.role === "user" ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Bot className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                )}>
                  {msg.content || (isLoading && index === messages.length - 1 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested questions - show only when there's just the initial message */}
        {messages.length === 1 && (
          <div className="shrink-0 border-t border-border bg-card/30">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">Tez savollar:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(question);
                    }}
                    className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Savolingizni yozing..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                className="gap-2 bg-gradient-to-r from-cyber-blue to-neon-purple hover:opacity-90"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Yuborish</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ALSA Alsamos Valley platformasi haqida ma'lumot beradi
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChat;
