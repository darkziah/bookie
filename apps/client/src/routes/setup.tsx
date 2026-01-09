import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  const currentUser = useQuery(
    api.librarians.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );
  const currentLibrarian = useQuery(
    api.librarians.getCurrentLibrarian,
    isAuthenticated ? {} : "skip"
  );
  const systemRequiresSetup = useQuery(api.librarians.requiresSetup);

  const setupFirstAdmin = useMutation(api.librarians.setupFirstAdmin);
  const acceptInvite = useMutation(api.librarians.acceptInvite);

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If already has librarian, go to dashboard
  if (currentLibrarian) {
    return <Navigate to="/dashboard" />;
  }

  // Show loading while checking
  if (currentLibrarian === undefined || systemRequiresSetup === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      if (systemRequiresSetup) {
        if (!name.trim()) {
          toast.error("Name is required");
          setIsLoading(false);
          return;
        }
        await setupFirstAdmin({ name: name.trim() });
        toast.success("Admin account created successfully!");
      } else {
        // For invited users, we try to accept the invite via email
        if (currentUser?.email) {
          await acceptInvite({ email: currentUser.email });
          toast.success("Welcome to the team!");
        } else {
          throw new Error("User email not found. Please contact admin.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

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
            School Library Management System
          </p>
        </div>

        {/* Setup Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center mb-2">
              <IconShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">
              {systemRequiresSetup ? "Complete Setup" : "Finish Registration"}
            </CardTitle>
            <CardDescription className="text-center">
              {systemRequiresSetup
                ? "You're authenticated! Now set up your librarian profile to access the system."
                : "You've signed up! Click below to link your account to your invitation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {systemRequiresSetup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || (systemRequiresSetup && !name.trim())}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  systemRequiresSetup ? "Complete Setup" : "Link Account"
                )}
              </Button>
            </form>
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

