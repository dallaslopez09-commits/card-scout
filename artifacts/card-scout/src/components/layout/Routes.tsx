import { useAuth } from "@workspace/replit-auth-web";
import { Shell } from "@/components/layout/Shell";
import { Switch, Route, Redirect } from "wouter";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Search from "@/pages/Search";
import Collection from "@/pages/Collection";
import Wishlist from "@/pages/Wishlist";
import Scan from "@/pages/Scan";
import { Loader2 } from "lucide-react";
import DealFinder from "@/pages/DealFinder";
import Sets from "@/pages/Sets";
import Insurance from "@/pages/Insurance";
import CardTimeline from "@/pages/CardTimeline";
import NotFound from "@/pages/not-found";

export function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <Shell>
      <Component {...rest} />
    </Shell>
  );
}

export default function Routes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
      <Route path="/collection" component={() => <ProtectedRoute component={Collection} />} />
      <Route path="/wishlist" component={() => <ProtectedRoute component={Wishlist} />} />
      <Route path="/scan" component={() => <ProtectedRoute component={Scan} />} />
      <Route path="/deals" component={() => <ProtectedRoute component={DealFinder} />} />
      <Route path="/sets" component={() => <ProtectedRoute component={Sets} />} />
      <Route path="/insurance" component={() => <ProtectedRoute component={Insurance} />} />
      <Route path="/collection/:id/timeline" component={() => <ProtectedRoute component={CardTimeline} />} />
      <Route component={NotFound} />
    </Switch>
  );
}
