import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AppLayout } from "@/components/layout/app-layout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bookie/ui/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bookie/ui/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookie/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookie/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bookie/ui/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "@bookie/ui/components/ui/avatar";
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconUsers,
  IconLoader2,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserOff,
  IconShieldCheck,
  IconId,
  IconPhone,
  IconSearch,
  IconUserPlus,
  IconMail,
  IconMailPlus,
  IconClock,
  IconX,
  IconRefresh,
  IconCopy,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const memberSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "staff", "student_assistant"]),
  employeeId: z.string(),
  phone: z.string(),
});

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "staff", "student_assistant"]),
  employeeId: z.string(),
  phone: z.string(),
});

export const Route = createFileRoute("/settings/members")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <AppLayout title="Members">
      <MembersContent />
    </AppLayout>
  );
}

function MembersContent() {
  const { librarian: currentUser } = useAuth();
  const members = useQuery(api.librarians.list, {});
  const invites = useQuery(api.librarians.listInvites, {});
  const updateMember = useMutation(api.librarians.update);
  const deactivateMember = useMutation(api.librarians.deactivate);
  const activateMember = useMutation(api.librarians.activate);
  const removeMember = useMutation(api.librarians.remove);
  const createInvite = useMutation(api.librarians.createInvite);
  const revokeInvite = useMutation(api.librarians.revokeInvite);
  const deleteInvite = useMutation(api.librarians.deleteInvite);
  const resendInvite = useMutation(api.librarians.resendInvite);

  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    _id: Id<"librarians">;
    name: string;
    role: "admin" | "staff" | "student_assistant";
    employeeId?: string;
    phone?: string;
    isActive: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const editForm = useForm({
    defaultValues: {
      name: "",
      role: "staff" as "admin" | "staff" | "student_assistant",
      employeeId: "",
      phone: "",
    },
    validators: {
      onChange: memberSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedMember) return;
      setIsLoading(true);
      try {
        await updateMember({
          id: selectedMember._id,
          name: value.name,
          role: value.role,
          employeeId: value.employeeId || undefined,
          phone: value.phone || undefined,
        });
        toast.success("Member updated successfully!");
        setIsEditDialogOpen(false);
        setSelectedMember(null);
      } catch (error: any) {
        toast.error("Failed to update member", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const inviteForm = useForm({
    defaultValues: {
      email: "",
      name: "",
      role: "staff" as "admin" | "staff" | "student_assistant",
      employeeId: "",
      phone: "",
    },
    validators: {
      onChange: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        await createInvite({
          email: value.email,
          name: value.name,
          role: value.role,
          employeeId: value.employeeId || undefined,
          phone: value.phone || undefined,
        });
        toast.success("Invitation created successfully!", {
          description: `${value.name} can now sign up with ${value.email}`,
        });
        setIsInviteDialogOpen(false);
        inviteForm.reset();
      } catch (error: any) {
        toast.error("Failed to create invitation", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const filteredMembers = members?.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.employeeId?.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  });

  const pendingInvites = invites?.filter((i) => i.status === "pending") || [];
  const otherInvites = invites?.filter((i) => i.status !== "pending") || [];

  const handleEditClick = (member: any) => {
    if (!member) return;
    setSelectedMember(member);
    editForm.reset({
      name: member.name,
      role: member.role,
      employeeId: member.employeeId || "",
      phone: member.phone || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (member: any) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      await removeMember({ id: selectedMember._id });
      toast.success("Member removed successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch (error: any) {
      toast.error("Failed to remove member", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (member: any) => {
    try {
      if (member.isActive) {
        await deactivateMember({ id: member._id });
        toast.success(`${member.name} has been deactivated`);
      } else {
        await activateMember({ id: member._id });
        toast.success(`${member.name} has been activated`);
      }
    } catch (error: any) {
      toast.error("Failed to update member status", { description: error.message });
    }
  };

  // handleUpdate is now inside editForm.onSubmit
  // handleCreateInvite is now inside inviteForm.onSubmit

  const handleRevokeInvite = async (inviteId: Id<"invites">) => {
    try {
      await revokeInvite({ id: inviteId });
      toast.success("Invitation revoked");
    } catch (error: any) {
      toast.error("Failed to revoke invitation", { description: error.message });
    }
  };

  const handleDeleteInvite = async (inviteId: Id<"invites">) => {
    try {
      await deleteInvite({ id: inviteId });
      toast.success("Invitation deleted");
    } catch (error: any) {
      toast.error("Failed to delete invitation", { description: error.message });
    }
  };

  const handleResendInvite = async (inviteId: Id<"invites">) => {
    try {
      await resendInvite({ id: inviteId });
      toast.success("Invitation refreshed");
    } catch (error: any) {
      toast.error("Failed to refresh invitation", { description: error.message });
    }
  };

  const copyInviteLink = (email: string) => {
    const message = `You've been invited to join the Bookie Library Management System. Please sign up using this email: ${email}`;
    navigator.clipboard.writeText(message);
    toast.success("Invite message copied to clipboard");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="border-green-500 text-green-600">Accepted</Badge>;
      case "revoked":
        return <Badge variant="outline" className="border-red-500 text-red-600">Revoked</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(timestamp);
  };

  if (members === undefined || invites === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground italic">Manage library staff and send invitations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)} className="h-10">
            <IconMailPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col gap-1 border-primary/20 bg-primary/5">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Members</span>
          <div className="text-xl sm:text-2xl font-bold">{members.length}</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admins</span>
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {members.filter((m) => m.role === "admin").length}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invites</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            {pendingInvites.length}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-green-200 bg-green-50 dark:bg-green-950/20">
          <span className="text-[10px] sm:text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Active</span>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {members.filter((m) => m.isActive).length}
          </div>
        </Card>
      </div>

      {/* Tabs for Members and Invites */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto justify-start sm:grid sm:grid-cols-2 sm:max-w-md h-auto p-1 bg-muted/50">
          <TabsTrigger value="members" className="flex-1 py-1.5 text-xs sm:text-sm gap-2 whitespace-nowrap">
            <IconUsers className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex-1 py-1.5 text-xs sm:text-sm gap-2 whitespace-nowrap">
            <IconMail className="h-4 w-4" />
            Invites ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="m-0">
          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-4 border-b">
              <CardTitle className="text-base">Team Roster</CardTitle>
              <CardDescription className="text-xs">
                Manage team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {filteredMembers && filteredMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden sm:table-cell">ID / Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => {
                        const isCurrentUser = currentUser?._id === member._id;
                        return (
                          <TableRow key={member._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-xs sm:text-sm">
                                    {member.name}
                                    {isCurrentUser && (
                                      <span className="text-[10px] text-muted-foreground ml-2">
                                        (You)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(member.role)} className="text-[10px] py-0 px-2 whitespace-nowrap">
                                {formatRole(member.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="text-xs font-mono">{member.employeeId || "—"}</div>
                              <div className="text-[10px] text-muted-foreground">{member.phone || ""}</div>
                            </TableCell>
                            <TableCell>
                              {member.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-500 text-green-600 text-[10px] py-0"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-red-500 text-red-600 text-[10px] py-0"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs hidden md:table-cell whitespace-nowrap">
                              {formatDate(member.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={isCurrentUser}
                                    >
                                      <IconDotsVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEditClick(member)}
                                      className="gap-2"
                                    >
                                      <IconEdit className="h-4 w-4" />
                                      Edit Member
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleToggleActive(member)}
                                      className="gap-2"
                                    >
                                      {member.isActive ? (
                                        <>
                                          <IconUserOff className="h-4 w-4" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <IconUserCheck className="h-4 w-4" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(member)}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <IconTrash className="h-4 w-4" />
                                      Remove Member
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <IconUsers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {searchQuery ? "No members found" : "No team members yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Invite members to get started"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="m-0 space-y-6">
          {/* Pending Invites */}
          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-amber-600" />
                    Pending Invites
                  </CardTitle>
                </div>
                <Button size="sm" onClick={() => setIsInviteDialogOpen(true)} className="h-8">
                  <IconMailPlus className="h-3.5 w-3.5 mr-1.5" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {pendingInvites.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Invited User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Invited By</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvites.map((invite) => (
                        <TableRow key={invite._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
                                  {invite.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{invite.name}</p>
                                <div className="sm:hidden">
                                  <Badge variant={getRoleBadgeVariant(invite.role)} className="text-[10px] py-0">
                                    {formatRole(invite.role)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] sm:text-xs">
                            {invite.email}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={getRoleBadgeVariant(invite.role)} className="text-[10px] py-0 px-2">
                              {formatRole(invite.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                            {invite.inviterName}
                          </TableCell>
                          <TableCell className="text-right text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(invite.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <IconDotsVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => copyInviteLink(invite.email)}
                                    className="gap-2"
                                  >
                                    <IconCopy className="h-4 w-4" />
                                    Copy Invite Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(invite._id)}
                                    className="gap-2"
                                  >
                                    <IconRefresh className="h-4 w-4" />
                                    Refresh Invite
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRevokeInvite(invite._id)}
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <IconX className="h-4 w-4" />
                                    Revoke Invite
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <IconMail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No pending invitations
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send an invitation to add new team members
                    </p>
                    <Button onClick={() => setIsInviteDialogOpen(true)}>
                      <IconMailPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Past Invites */}
          {otherInvites.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-4 border-b">
                <CardTitle className="text-base font-semibold">Invite History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherInvites.map((invite) => (
                        <TableRow key={invite._id} className="opacity-60">
                          <TableCell>
                            <div className="font-medium text-xs sm:text-sm">{invite.name}</div>
                            <div className="sm:hidden text-[10px] font-mono text-muted-foreground">{invite.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell font-mono text-[10px] sm:text-xs">
                            {invite.email}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invite.status)}
                          </TableCell>
                          <TableCell className="text-right text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(invite.acceptedAt || invite.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteInvite(invite._id)}
                              >
                                <IconTrash className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="h-5 w-5" />
              Edit Member
            </DialogTitle>
            <DialogDescription>
              Update member information and role
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <editForm.Field
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                    <IconUserPlus className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              )}
            />
            <editForm.Field
              name="role"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                    <IconShieldCheck className="h-4 w-4" />
                    Role
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: "admin" | "staff" | "student_assistant") =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student_assistant">
                        Student Assistant
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <editForm.Field
                name="employeeId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                      <IconId className="h-4 w-4" />
                      Employee ID
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Employee ID"
                    />
                  </div>
                )}
              />
              <editForm.Field
                name="phone"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                      <IconPhone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                )}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <editForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onClick={() => editForm.handleSubmit()}
                  disabled={isLoading || isSubmitting || !canSubmit}
                  className="w-full sm:w-auto"
                >
                  {isLoading || isSubmitting ? (
                    <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconTrash className="h-5 w-5" />
              Remove Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold">{selectedMember?.name}</span> from
              the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconMailPlus className="h-5 w-5" />
              Invite New Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to a new team member. They will be able to sign up using the invited email address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <inviteForm.Field
              name="email"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                    <IconMail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="member@school.edu"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-[10px] text-destructive">
                      {field.state.meta.errors[0]?.toString()}
                    </p>
                  )}
                </div>
              )}
            />
            <inviteForm.Field
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                    <IconUserPlus className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              )}
            />
            <inviteForm.Field
              name="role"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                    <IconShieldCheck className="h-4 w-4" />
                    Role *
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value: "admin" | "staff" | "student_assistant") =>
                      field.handleChange(value)
                    }
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student_assistant">
                        Student Assistant
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <inviteForm.Field
                name="employeeId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                      <IconId className="h-4 w-4" />
                      Employee ID
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="ID (optional)"
                    />
                  </div>
                )}
              />
              <inviteForm.Field
                name="phone"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-xs">
                      <IconPhone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Phone (optional)"
                    />
                  </div>
                )}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <inviteForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onClick={() => inviteForm.handleSubmit()}
                  disabled={isLoading || isSubmitting || !canSubmit}
                  className="w-full sm:w-auto"
                >
                  {isLoading || isSubmitting ? (
                    <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <IconMailPlus className="h-4 w-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              )}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
