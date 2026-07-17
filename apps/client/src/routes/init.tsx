import { createFileRoute, Navigate } from "@tanstack/react-router";
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
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

export const Route = createFileRoute("/init")({
  component: InitPage,
});

const initSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function InitPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  // Check if system needs initial setup
  const systemRequiresSetup = useQuery(api.librarians.requiresSetup);

  // Check if current user already has a librarian record
  const currentLibrarian = useQuery(
    api.librarians.getCurrentLibrarian,
    isAuthenticated ? {} : "skip"
  );

  const setupFirstAdmin = useMutation(api.librarians.setupFirstAdmin);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onChange: initSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        await signIn("password", {
          email: value.email,
          password: value.password,
          flow: "signUp",
        });
        // The useEffect below will handle setupFirstAdmin after auth completes
      } catch (error: any) {
        toast.error(error.message || "Initialization failed");
        setIsLoading(false);
      }
    },
  });

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
          const values = form.state.values;
          const adminName = values.name || values.email.split("@")[0] || "Admin";
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
  }, [isAuthenticated, currentLibrarian, systemRequiresSetup, setupFirstAdmin, form.state.values]);

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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Full Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      disabled={isLoading}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => e?.message ?? String(e)).join(", ")}</em>
                    ) : null}
                  </div>
                )}
              />
              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Admin Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      disabled={isLoading}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => e?.message ?? String(e)).join(", ")}</em>
                    ) : null}
                  </div>
                )}
              />
              <form.Field
                name="password"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-xs text-destructive">{field.state.meta.errors.map((e: any) => e?.message ?? String(e)).join(", ")}</em>
                    ) : null}
                  </div>
                )}
              />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || !canSubmit || isSubmitting}
                  >
                    {isLoading || isSubmitting ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Create Admin Account"
                    )}
                  </Button>
                )}
              />
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
