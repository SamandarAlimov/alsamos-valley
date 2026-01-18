import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Layers, Rocket, Calendar, ArrowRight, Loader2 } from "lucide-react";

interface SearchResult {
  rooms: { id: string; name: string; description: string; hub: string }[];
  startups: { id: string; name: string; description: string; stage: string }[];
  events: { id: string; title: string; description: string; event_type: string }[];
}

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke("search", {
          body: { query },
        });
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const totalResults = results 
    ? results.rooms.length + results.startups.length + results.events.length 
    : 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:border-primary/50 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">Search...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs rounded bg-secondary border border-border">⌘K</kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rooms, startups, events..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {loading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Type at least 2 characters to search</p>
                </div>
              ) : results && totalResults > 0 ? (
                <div className="p-2">
                  {/* Rooms */}
                  {results.rooms.length > 0 && (
                    <div className="mb-4">
                      <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Rooms
                      </h3>
                      {results.rooms.map((room) => (
                        <Link
                          key={room.id}
                          to={`/room/${room.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{room.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{room.hub} Hub</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Startups */}
                  {results.startups.length > 0 && (
                    <div className="mb-4">
                      <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Startups
                      </h3>
                      {results.startups.map((startup) => (
                        <Link
                          key={startup.id}
                          to={`/startup/${startup.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{startup.name}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{startup.stage}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Events */}
                  {results.events.length > 0 && (
                    <div>
                      <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Events
                      </h3>
                      {results.events.map((event) => (
                        <Link
                          key={event.id}
                          to="/events"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{event.event_type}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : results ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No results found for "{query}"</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
