import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Router as WouterRouter } from 'wouter';
import Routes from '@/components/layout/Routes';

function redirectToLogin() {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '') || '';
  window.location.href = `/api/login?returnTo=${encodeURIComponent(base || '/')}`;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry 401 — session is gone, send user to login
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status: number }).status === 401
        ) {
          redirectToLogin();
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status: number }).status === 401
        ) {
          redirectToLogin();
        }
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Routes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
