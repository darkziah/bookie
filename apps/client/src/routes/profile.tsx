import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SidebarProvider, SidebarInset } from "@bookie/ui/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bookie/ui/components/ui/avatar";
import { Badge } from "@bookie/ui/components/ui/badge";
import { Separator } from "@bookie/ui/components/ui/separator";
import {
  IconUserCircle,
  IconLoader2,
  IconDeviceFloppy,
  IconMail,
  IconPhone,
  IconId,
  IconShieldCheck,
  IconCalendar,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  employeeId: z.string(),
  phone: z.string(),
});

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <ProfileContent />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

function ProfileContent() {
  const { librarian, isLoading } = useAuth();
  const updateProfile = useMutation(api.librarians.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    defaultValues: {
      name: librarian?.name || "",
      employeeId: librarian?.employeeId || "",
      phone: librarian?.phone || "",
    },
    validators: {
      onChange: profileSchema,
    },
    onSubmit: async ({ value }) => {
      if (!librarian) return;
      setIsSaving(true);
      try {
        await updateProfile({
          name: value.name,
          employeeId: value.employeeId || undefined,
          phone: value.phone || undefined,
        });
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } catch (error: any) {
        toast.error("Failed to update profile", { description: error.message });
      } finally {
        setIsSaving(false);
      }
    },
  });

  // Re-sync form when librarian data changes and not editing
  useEffect(() => {
    if (librarian && !isEditing) {
      form.reset({
        name: librarian.name || "",
        employeeId: librarian.employeeId || "",
        phone: librarian.phone || "",
      });
    }
  }, [librarian, isEditing, form]);

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "staff":
        return "secondary";
      case "student_assistant":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading || !librarian) {
    return (
      <div className="flex items-center justify-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <IconUserCircle className="h-8 w-8" />
            My Profile
          </h1>
          <p className="text-muted-foreground">
            View and manage your account information
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <IconX className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onClick={() => form.handleSubmit()}
                  disabled={isSaving || isSubmitting || !canSubmit}
                >
                  {isSaving || isSubmitting ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconDeviceFloppy className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              )}
            />
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        {/* Profile Header with Gradient */}
        <div className="h-32 bg-gradient-to-r from-primary/80 via-primary to-primary/60 relative">
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src="" alt={librarian.name} />
              <AvatarFallback className="text-3xl font-bold bg-background text-primary">
                {librarian.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">{librarian.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(librarian.role)}>
                  <IconShieldCheck className="h-3 w-3 mr-1" />
                  {formatRole(librarian.role)}
                </Badge>
                {librarian.isActive ? (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-600"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-500 text-red-600"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconCalendar className="h-4 w-4" />
              <span>Member since {formatDate(librarian.createdAt)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Profile Information */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <IconUserCircle className="h-4 w-4" />
                Full Name
              </Label>
              {isEditing ? (
                <form.Field
                  name="name"
                  children={(field) => (
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  )}
                />
              ) : (
                <p className="text-lg font-medium">{librarian.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="employeeId"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <IconId className="h-4 w-4" />
                Employee ID
              </Label>
              {isEditing ? (
                <form.Field
                  name="employeeId"
                  children={(field) => (
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter employee ID"
                    />
                  )}
                />
              ) : (
                <p className="text-lg font-medium">
                  {librarian.employeeId || (
                    <span className="text-muted-foreground italic">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <IconPhone className="h-4 w-4" />
                Phone Number
              </Label>
              {isEditing ? (
                <form.Field
                  name="phone"
                  children={(field) => (
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  )}
                />
              ) : (
                <p className="text-lg font-medium">
                  {librarian.phone || (
                    <span className="text-muted-foreground italic">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <IconShieldCheck className="h-4 w-4" />
                Role
              </Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getRoleBadgeVariant(librarian.role)}
                  className="text-sm"
                >
                  {formatRole(librarian.role)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (Contact admin to change)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IconMail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Signed in with email and password
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-600">
              Active
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            To change your password, please sign out and use the "Forgot
            Password" option on the login page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
