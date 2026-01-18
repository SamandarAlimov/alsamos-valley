import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Send, CheckCircle2, Loader2, User, Building2, DollarSign, Star } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  company: string | null;
  bio: string | null;
  avatar_url: string | null;
  min_investment: number | null;
  max_investment: number | null;
  investment_focus: string[] | null;
  is_verified: boolean | null;
  portfolio_count: number | null;
}

interface InvestorConnectProps {
  startupId: string;
  startupName: string;
  investors: Investor[];
}

const InvestorConnect = ({ startupId, startupName, investors }: InvestorConnectProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const sendConnectionRequest = async () => {
    if (!user || !selectedInvestor) {
      toast({ title: "Please sign in to connect", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("investor_connections").insert({
        startup_id: startupId,
        investor_id: selectedInvestor.id,
        message: message || `I would like to discuss investment opportunities for ${startupName}.`,
        status: "pending",
      });

      if (error) throw error;

      setSentRequests([...sentRequests, selectedInvestor.id]);
      setSelectedInvestor(null);
      setMessage("");
      
      toast({
        title: "Connection Request Sent!",
        description: `Your meeting request has been sent to ${selectedInvestor.name}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send request",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatInvestmentRange = (min: number | null, max: number | null) => {
    if (!min && !max) return "Flexible";
    if (!max) return `$${(min! / 1000).toFixed(0)}K+`;
    return `$${(min! / 1000).toFixed(0)}K - $${(max / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Connect with Investors</h3>
          <p className="text-sm text-muted-foreground">Request meetings with verified investors</p>
        </div>
      </div>

      {/* Investor List */}
      <div className="grid gap-3">
        {investors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No investors available at the moment</p>
          </div>
        ) : (
          investors.map((investor) => (
            <div
              key={investor.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedInvestor?.id === investor.id
                  ? "border-primary bg-primary/5"
                  : sentRequests.includes(investor.id)
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border/50 bg-secondary/30 hover:border-primary/30"
              }`}
              onClick={() => !sentRequests.includes(investor.id) && setSelectedInvestor(investor)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-blue/30 to-neon-purple/30 flex items-center justify-center shrink-0">
                  {investor.avatar_url ? (
                    <img 
                      src={investor.avatar_url} 
                      alt={investor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{investor.name}</h4>
                    {investor.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  
                  {investor.company && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <Building2 className="w-3.5 h-3.5" />
                      {investor.company}
                    </div>
                  )}

                  {investor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{investor.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatInvestmentRange(investor.min_investment, investor.max_investment)}
                    </div>
                    {investor.portfolio_count && investor.portfolio_count > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-3.5 h-3.5" />
                        {investor.portfolio_count} investments
                      </div>
                    )}
                  </div>

                  {investor.investment_focus && investor.investment_focus.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {investor.investment_focus.slice(0, 3).map((focus) => (
                        <span key={focus} className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                          {focus}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {sentRequests.includes(investor.id) ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sent
                    </span>
                  ) : selectedInvestor?.id === investor.id ? (
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Selected
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Form */}
      {selectedInvestor && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              Message to {selectedInvestor.name}
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setSelectedInvestor(null)}>
              Cancel
            </Button>
          </div>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${selectedInvestor.name}, I would like to discuss investment opportunities for ${startupName}...`}
            rows={4}
            className="bg-background/50"
          />

          <Button 
            onClick={sendConnectionRequest} 
            className="w-full"
            variant="hero"
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Meeting Request
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvestorConnect;
