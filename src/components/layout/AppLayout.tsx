import { ReactNode, useState, createContext, useContext } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  fullWidth?: boolean;
}

const AppLayout = ({ children, showFooter = true, fullWidth = false }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        {/* Sidebar - Desktop/Tablet */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Main Content */}
        <main 
          className={cn(
            "min-h-screen transition-all duration-300",
            // Desktop/Tablet: Account for sidebar
            collapsed ? "md:ml-16" : "md:ml-64",
            // Mobile: Account for header and bottom nav
            "pt-14 pb-20 md:pt-0 md:pb-0"
          )}
        >
          {children}
        </main>
        
        {/* Bottom Nav - Mobile */}
        <BottomNav />
      </div>
    </SidebarContext.Provider>
  );
};

export default AppLayout;
