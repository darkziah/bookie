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
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

const setupSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

function SetupPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);

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

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: setupSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        if (systemRequiresSetup) {
          if (!value.name?.trim()) {
            toast.error("Name is required");
            setIsLoading(false);
            return;
          }
          await setupFirstAdmin({ name: value.name.trim() });
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
    },
  });

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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {systemRequiresSetup && (
                <form.Field
                  name="name"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Your Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="Enter your full name"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      {field.state.meta.errors ? (
                        <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => e?.message ?? String(e)).join(", ")}</em>
                      ) : null}
                    </div>
                  )}
                />
              )}

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || (systemRequiresSetup && !canSubmit) || isSubmitting}
                  >
                    {isLoading || isSubmitting ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      systemRequiresSetup ? "Complete Setup" : "Link Account"
                    )}
                  </Button>
                )}
              />
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

