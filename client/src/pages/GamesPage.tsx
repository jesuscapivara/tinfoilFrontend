import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Database, Copy, CheckCircle2 } from "lucide-react";
import { getBackendGames } from "@/lib/api";

export default function GamesPage() {
  const { user } = useAuth();
  const { data: gamesData } = useQuery({
    queryKey: ["games"],
    queryFn: () => getBackendGames(user?.tinfoilUser, undefined), // TODO: Obter senha do usuário
    enabled: !!user?.tinfoilUser,
  });
  
  const games = gamesData?.files || [];

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-2xl font-bold">ACCESS DENIED</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="border-b-2 border-primary bg-card/80 backdrop-blur">
        <div className="container py-8">
          <div className="flex items-center gap-4">
            <Database className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                Game Index
              </h1>
              <p className="text-secondary text-sm mt-2 font-mono">
                {games?.length || 0} games indexed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {games && games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game: any) => (
              <Card key={game.id} className="cyber-card group hover:shadow-neon transition-all duration-300">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-foreground font-bold truncate group-hover:text-primary transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-secondary mt-2 font-mono truncate">
                      {game.titleId || "N/A"}
                    </p>
                  </div>

                  <div className="border-t border-primary/30 pt-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-secondary font-bold">Version</p>
                        <p className="text-foreground font-mono mt-1">{game.version || 0}</p>
                      </div>
                      <div>
                        <p className="text-secondary font-bold">Size</p>
                        <p className="text-foreground font-mono mt-1">
                          {game.size ? (game.size / 1024 / 1024 / 1024).toFixed(2) + " GB" : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>


                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(game.url);
                    }}
                    className="w-full mt-3 p-3 border-2 border-primary/60 hover:border-primary hover:bg-primary/10 transition-all text-xs text-secondary font-bold flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="cyber-card text-center py-16">
            <Database className="w-16 h-16 text-secondary mx-auto mb-4 opacity-40" />
            <p className="text-secondary font-bold text-lg">No games indexed yet</p>
            <p className="text-muted-foreground text-sm mt-2">Upload torrent files to index games</p>
          </Card>
        )}
      </div>
    </div>
  );
}
