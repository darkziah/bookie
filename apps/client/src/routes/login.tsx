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
import { IconBook, IconLoader2, IconAlertCircle, IconMail, IconShieldCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Separate component to handle signout (avoids hook issues)
function UnauthorizedSignOut() {
  const { signOut } = useAuthActions();

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={async () => {
        await signOut();
        window.location.reload();
      }}
    >
      Sign Out
    </Button>
  );
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function LoginPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        // For signup, check if invite exists first (unless system is in setup mode)
        if (isSignUp && !pendingInvite && !systemRequiresSetup) {
          toast.error("No invitation found for this email", {
            description: "Please contact an administrator for an invitation.",
          });
          setIsLoading(false);
          return;
        }

        await signIn("password", {
          email: value.email,
          password: value.password,
          ...(isSignUp ? { flow: "signUp" } : { flow: "signIn" }),
        });

        toast.success(isSignUp ? "Account created!" : "Welcome back!");
      } catch (error: any) {
        toast.error(error.message || "Authentication failed");
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Watch email for invite check
  const emailValue = useStore(form.store, (state) => state.values.email);

  // Check if current user has a librarian record
  const currentLibrarian = useQuery(
    api.librarians.getCurrentLibrarian,
    isAuthenticated ? {} : "skip"
  );

  // Check if system needs initial setup (still needed for redirection if someone hits /login directly)
  const systemRequiresSetup = useQuery(api.librarians.requiresSetup);

  // Check for pending invite (for signup flow)
  const pendingInvite = useQuery(
    api.librarians.checkInvite,
    isSignUp && emailValue ? { email: emailValue } : "skip"
  );

  const acceptInvite = useMutation(api.librarians.acceptInvite);

  // Auto-accept invite after authentication (for invited users)
  useEffect(() => {
    async function handlePostAuth() {
      if (isAuthenticated && currentLibrarian === null && emailValue && !systemRequiresSetup) {
        try {
          await acceptInvite({ email: emailValue });
          toast.success("Welcome to the team!");
        } catch {
          // Invite failure will be handled by UI states below
        }
      }
    }
    handlePostAuth();
  }, [isAuthenticated, currentLibrarian, emailValue, acceptInvite, systemRequiresSetup]);

  // Redirect if system needs setup and user is authenticated
  if (!authLoading && systemRequiresSetup === true && isAuthenticated) {
    return <Navigate to="/setup" />;
  }

  // Redirect if already authenticated AND has librarian record
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && currentLibrarian) {
    return <Navigate to="/dashboard" />;
  }

  // Show loading if authenticated but waiting for librarian check
  if (isAuthenticated && currentLibrarian === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying account...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if authenticated but no librarian record
  if (isAuthenticated && currentLibrarian === null && systemRequiresSetup === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconAlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Your account is not authorized to access this system. Please contact an administrator for an invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">{emailValue || "Unknown"}</span>
              </p>
            </div>
            <UnauthorizedSignOut />
          </CardContent>
        </Card>
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

        {/* Login Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Create an account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp
                ? "Enter your invited email to get started"
                : "Enter your credentials to access the library system"}
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
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="Enter your email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</em>
                    ) : null}
                    {/* Show invite status for signup */}
                    {isSignUp && field.state.value && field.state.value.includes("@") && !systemRequiresSetup && (
                      <div className="text-xs mt-1">
                        {pendingInvite === undefined ? (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <IconLoader2 className="h-3 w-3 animate-spin" />
                            Checking invitation status...
                          </span>
                        ) : pendingInvite ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <IconMail className="h-3 w-3" />
                            Invitation found! You'll join as {pendingInvite.role.replace("_", " ")}.
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1">
                            <IconAlertCircle className="h-3 w-3" />
                            No invitation found. Contact an administrator.
                          </span>
                        )}
                      </div>
                    )}
                    {isSignUp && systemRequiresSetup && (
                      <div className="text-xs mt-1 text-blue-600 flex items-center gap-1">
                        <IconShieldCheck className="h-3 w-3" />
                        First admin setup detected. No invite required.
                      </div>
                    )}
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
                      placeholder="Enter your password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    {field.state.meta.errors ? (
                      <em className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</em>
                    ) : null}
                  </div>
                )}
              />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || (isSignUp && !pendingInvite && emailValue.includes("@") && pendingInvite !== undefined && !systemRequiresSetup) || !canSubmit || isSubmitting}
                  >
                    {isLoading || isSubmitting ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSignUp ? "Creating account..." : "Signing in..."}
                      </>
                    ) : isSignUp ? (
                      "Create Account"
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                )}
              />
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </div>

            {isSignUp && !systemRequiresSetup && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Signups require an invitation from an administrator.
              </p>
            )}
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
