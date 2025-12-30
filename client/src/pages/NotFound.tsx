import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 border-2 border-primary cyber-card">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-destructive" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-primary mb-2 uppercase tracking-widest">
            404
          </h1>

          <h2 className="text-2xl font-bold text-foreground uppercase tracking-wider mb-4">
            ▸ PAGE NOT FOUND ◂
          </h2>

          <p className="text-secondary mb-8 leading-relaxed font-mono">
            A página que você está procurando não existe.
            <br />
            Ela pode ter sido movida ou deletada.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoHome} className="cyber-btn px-8 py-4">
              <Home className="w-4 h-4 mr-2" />
              VOLTAR AO INÍCIO
            </Button>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary/10 px-8 py-4"
              >
                DASHBOARD
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
