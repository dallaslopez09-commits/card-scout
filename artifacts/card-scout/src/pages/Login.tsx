import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary selection:text-white">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Branding & Value Prop */}
        <div className="lg:flex-1 bg-primary text-primary-foreground flex flex-col justify-between p-8 lg:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded shadow-sm flex items-center justify-center">
              <span className="text-primary font-black text-xl">CS</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">Card Scout</span>
          </div>

          <div className="mt-16 lg:mt-0 space-y-6 max-w-xl">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              The command center for serious collectors.
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/80 leading-relaxed font-light">
              Track your portfolio, discover market trends, and manage your wishlist with precision. Every card, every dollar of value, all in one pristine place.
            </p>
          </div>

          <div className="mt-16 text-sm text-primary-foreground/60 font-mono">
            SYSTEM STATUS: ONLINE // v1.0.0
          </div>
        </div>

        {/* Right: Login Action */}
        <div className="lg:w-[480px] bg-card flex flex-col justify-center p-8 lg:p-16 border-l border-border shadow-2xl z-10">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight">Access Terminal</h2>
              <p className="text-muted-foreground">Sign in to authenticate your collection.</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => login()} 
                className="w-full h-14 text-base font-semibold uppercase tracking-wide"
                size="lg"
              >
                Authenticate Collection
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground/80 font-mono">
                  SECURE CONNECTION // OIDC ENCRYPTED
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
