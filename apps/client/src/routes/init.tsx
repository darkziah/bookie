import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@bookie/ui/components/ui/button";
import { Input } from "@bookie/ui/components/ui/input";
import { Label } from "@bookie/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import { IconBook, IconLoader2, IconShieldCheck } from "@tabler/icons-react";
import { toast } from "sonner";

export const Route = createFileRoute("/init")({
  component: InitPage,
});

function InitPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check if system needs initial setup
  const systemRequiresSetup = useQuery(api.librarians.requiresSetup);

  // Check if current user already has a librarian record
  const currentLibrarian = useQuery(
    api.librarians.getCurrentLibrarian,
    isAuthenticated ? {} : "skip"
  );

  const setupFirstAdmin = useMutation(api.librarians.setupFirstAdmin);

  // If system is already set up, go to login
  if (systemRequiresSetup === false) {
    return <Navigate to="/login" />;
  }

  // If authenticated and has librarian record, go to dashboard
  if (isAuthenticated && currentLibrarian) {
    return <Navigate to="/dashboard" />;
  }

  // If authenticated but no librarian record, we should try to call setupFirstAdmin
  // (This handles the case where the user signed up but didn't finish the mutation)
  useEffect(() => {
    async function handleAutoSetup() {
      if (isAuthenticated && currentLibrarian === null && systemRequiresSetup) {
        setIsLoading(true);
        try {
          // Use name from form if available, otherwise email prefix
          const adminName = formData.name || formData.email.split("@")[0] || "Admin";
          await setupFirstAdmin({ name: adminName });
          toast.success("System initialized successfully!");
        } catch (error: any) {
          toast.error(error.message || "Final setup failed");
        } finally {
          setIsLoading(false);
        }
      }
    }
    handleAutoSetup();
  }, [isAuthenticated, currentLibrarian, systemRequiresSetup, setupFirstAdmin, formData.name, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("password", {
        email: formData.email,
        password: formData.password,
        flow: "signUp",
      });
      // The useEffect above will handle setupFirstAdmin after auth completes
    } catch (error: any) {
      toast.error(error.message || "Initialization failed");
      setIsLoading(false);
    }
  };

  if (authLoading || systemRequiresSetup === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <IconBook className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bookie</h1>
          <p className="text-muted-foreground mt-1">
            System Initialization
          </p>
        </div>

        {/* Init Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center mb-2">
              <IconShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">
              Welcome to Bookie
            </CardTitle>
            <CardDescription className="text-center">
              Create the first administrator account to initialize your library system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
            </form>

            <p className="text-xs text-amber-600/80 text-center mt-6">
              Security Note: The first user to complete this form will hold permanent administrative control over the system.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Bookie Library System
        </p>
      </div>
    </div>
  );
}
