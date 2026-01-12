import { useState, useEffect, useCallback } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
  useLocation,
  RouterProvider,
  useParams
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Book, Home, LogOut } from "lucide-react";

import { WelcomeScreen } from "./screens/WelcomeScreen";
import { ScanStudentScreen } from "./screens/ScanStudentScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { SessionControls } from "./components/session-controls";

// --- ROOT COMPONENT (Layout & Global Logic) ---

function RootComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  const { studentId } = useParams({ strict: false }) as { studentId: string };

  // Fetch kiosk settings
  const settings = useQuery(api.kiosk.getKioskSettings);
  const student = useQuery(api.kiosk.getStudentById, studentId ? { studentId } : "skip");
  const idleTimeout = (settings?.kioskTimeout ?? 30) * 1000; // Convert to ms
  const timeoutSeconds = settings?.kioskTimeout ?? 30;

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Update "now" every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const secondsRemaining = Math.max(0, Math.ceil((idleTimeout - (now - lastActivity)) / 1000));

  // Reset to welcome screen after inactivity
  useEffect(() => {
    // If NOT on welcome screen (Path is not '/')
    if ((now - lastActivity > idleTimeout) && location.pathname !== "/") {
      navigate({ to: "/" });
      toast.info("Session timed out");
    }
  }, [now, lastActivity, idleTimeout, location.pathname, navigate]);

  // Global touch/click handler to reset activity
  useEffect(() => {
    const handler = () => resetActivity();
    window.addEventListener("touchstart", handler);
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [resetActivity]);

  const handleQuickLogout = () => {
    navigate({ to: "/" });
    toast.info("Session ended");
  };

  const isWelcomeScreen = location.pathname === "/";

  return (
    <div className="h-screen flex flex-col bg-background selection:bg-primary/20 overflow-hidden">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex items-center gap-3 text-left">
            <Book className="size-8 md:size-10 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-foreground leading-none">
                {settings?.libraryName ?? "Library"} <span className="text-primary">KIOSK</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium leading-tight mt-1">
                {settings?.schoolName ?? "Student Self-Service Terminal"}      Powered by <span className="font-semibold text-primary/70">Bookie</span>
              </p>
            </div>
          </div>

          {/* Right: Session Controls */}
          {student && (
            <SessionControls
              student={student}
              secondsRemaining={secondsRemaining}
              onLogout={handleQuickLogout}
            />
          )}
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 md:p-8 max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>


    </div>
  );
}

// --- ROUTE WRAPPERS ---

function WelcomeWrapper() {
  const navigate = useNavigate();
  return <WelcomeScreen onStart={() => navigate({ to: "/scan" })} />;
}

function ScanWrapper() {
  const navigate = useNavigate();
  return (
    <ScanStudentScreen
      onScan={(id) => navigate({ to: "/checkout/$studentId", params: { studentId: id } })}
      onCancel={() => navigate({ to: "/" })}
    />
  );
}

function CheckoutWrapper() {
  const navigate = useNavigate();
  // Using explicit strict: false to avoid circular dependency in definition if we used checkoutRoute.useParams
  // and manually typing it.
  const { studentId } = useParams({ strict: false }) as { studentId: string };

  return (
    <CheckoutScreen
      studentId={studentId}
      onComplete={() => navigate({ to: "/success" })}
      onCancel={() => navigate({ to: "/" })}
    />
  );
}

function SuccessWrapper() {
  const navigate = useNavigate();
  return <SuccessScreen onDone={() => navigate({ to: "/" })} />;
}

// --- ROUTE DEFINITIONS ---

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: WelcomeWrapper,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: ScanWrapper,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout/$studentId",
  component: CheckoutWrapper,
});

const successRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/success",
  component: SuccessWrapper,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  scanRoute,
  checkoutRoute,
  successRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
