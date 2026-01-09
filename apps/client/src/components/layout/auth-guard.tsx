import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: ("admin" | "staff" | "student_assistant")[];
  fallbackPath?: string;
}

/**
 * Protects routes requiring authentication
 */
export function AuthGuard({
  children,
  requiredRoles,
  fallbackPath = "/login",
}: AuthGuardProps) {
  const { isLoading, isAuthenticated, librarian } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} />;
  }

  // If roles are required, check if user has one of them
  if (requiredRoles && librarian) {
    if (!requiredRoles.includes(librarian.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
