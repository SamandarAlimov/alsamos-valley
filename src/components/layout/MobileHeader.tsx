import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import alsamosLogo from "@/assets/alsamos-logo.png";
import NotificationBell from "@/components/NotificationBell";

const MobileHeader = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src={alsamosLogo} 
            alt="Alsamos Logo" 
            className="w-8 h-8 group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex flex-col">
            <span className="font-display font-bold text-base leading-tight text-foreground">Alsamos</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider">VALLEY</span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {user && (
            <>
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
              <NotificationBell />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
