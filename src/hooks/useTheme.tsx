import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): "light" | "dark" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: Theme, animate: boolean = false) => {
  const root = document.documentElement;
  
  // Add transition class for smooth animation
  if (animate) {
    root.classList.add("theme-transition");
  }
  
  if (theme === "system") {
    const systemTheme = getSystemTheme();
    if (systemTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Remove transition class after animation completes
  if (animate) {
    setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 350);
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage or default to "system"
    const cached = localStorage.getItem("theme") as Theme | null;
    return cached || "system";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme immediately on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Load theme from database when user logs in
  useEffect(() => {
    const loadTheme = async () => {
      // If user is logged in, load from database
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("user_settings")
            .select("theme")
            .eq("user_id", user.id)
            .single();

          if (!error && data?.theme) {
            const dbTheme = data.theme as Theme;
            setThemeState(dbTheme);
            applyTheme(dbTheme);
            localStorage.setItem("theme", dbTheme);
          }
        } catch (error) {
          console.error("Error loading theme:", error);
        }
      }

      setIsLoading(false);
    };

    loadTheme();
  }, [user?.id]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => applyTheme("system", true);
    
    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme, true); // Enable animation when user changes theme
    localStorage.setItem("theme", newTheme);

    // Save to database if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from("user_settings")
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
