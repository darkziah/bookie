import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@bookie/ui/components/ui/button";
import { Input } from "@bookie/ui/components/ui/input";
import { Label } from "@bookie/ui/components/ui/label";
import {
  Card,
  CardContent,
} from "@bookie/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bookie/ui/components/ui/dialog";
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
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconPlus,
  IconSearch,
  IconUser,
  IconLoader2,
  IconEdit,
  IconBan,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";

// Validation schema for Faculty
const facultySchema = z.object({
  facultyId: z.string().min(1, "Faculty ID is required"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  phone: z.string().optional(),
  borrowingLimit: z.number().min(1, "Limit must be at least 1"),
});

export const Route = createFileRoute("/faculty/")({
  component: FacultyPage,
});

function FacultyPage() {
  return (
    <AppLayout title="Faculty">
      <FacultyContent />
    </AppLayout>
  );
}

function FacultyContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Use Paginated Query for Faculty
  const {
    results: facultyList,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.faculty.paginatedList,
    {
      department: departmentFilter && departmentFilter !== "all" ? departmentFilter : undefined,
    },
    { initialNumItems: 20 }
  );

  const searchResults = useQuery(
    api.faculty.search,
    searchQuery.trim().length >= 2 ? { searchTerm: searchQuery.trim() } : "skip"
  );

  const displayedFaculty = searchQuery.trim().length >= 2 ? searchResults : facultyList;
  const isLoading = status === "LoadingFirstPage";

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground">Manage faculty records and borrowing status</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Faculty
            </Button>
          </DialogTrigger>
          <AddFacultyDialog onClose={() => setShowAddDialog(false)} />
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Department Filter could be pre-populated or free text if departments are dynamic. 
            For now, keeping it simple or maybe removing if departments are too varied. 
            Let's keep it simple and just use search for now, or maybe a text input for filter?
            I'll use a simple input for department filter if needed, or better yet, skip specific dept filter UI for MVP unless requested.
            Actually, the paginated query supports department filter. Let's make it a simple text input for now or a select if we had a list of depts.
            I'll skip the UI for Dept filter to keep it clean unless user asked, but I implemented backend support.
            Let's add a basic Input for department filter just in case.
        */}
        <Input
          placeholder="Filter by Department..."
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full sm:w-[200px]"
        />
      </div>

      {/* Faculty Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading || displayedFaculty === undefined ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayedFaculty.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <IconUser className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No faculty found</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {searchQuery ? "Try a different search term" : "Add your first faculty member"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Loans</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedFaculty.map((faculty: any) => (
                    <FacultyRow key={faculty._id} faculty={faculty} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {status === "CanLoadMore" && !searchQuery && (
            <div className="p-4 flex justify-center border-t">
              <Button
                variant="outline"
                onClick={() => loadMore(20)}
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FacultyRow({ faculty }: { faculty: any }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const blockFaculty = useMutation(api.faculty.block);
  const unblockFaculty = useMutation(api.faculty.unblock);

  const handleToggleBlock = async () => {
    try {
      setIsBlocking(true);
      if (faculty.isBlocked) {
        await unblockFaculty({ id: faculty._id as Id<"faculty"> });
        toast.success("Faculty unblocked");
      } else {
        await blockFaculty({
          id: faculty._id as Id<"faculty">,
          reason: "Blocked by librarian",
        });
        toast.success("Faculty blocked");
      }
    } catch (error: any) {
      toast.error("Failed to update status", { description: error.message });
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs sm:text-sm">{faculty.facultyId}</TableCell>
        <TableCell>
          <div className="font-medium text-sm sm:text-base">
            <Link to="/faculty/$facultyId" params={{ facultyId: faculty._id }} className="hover:underline">
              {faculty.name}
            </Link>
          </div>
          <div className="text-[10px] text-muted-foreground">{faculty.email}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell text-sm">
          {faculty.department}
        </TableCell>
        <TableCell>
          {faculty.isBlocked ? (
            <Badge variant="destructive" className="text-[10px] py-0">Blocked</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] py-0 border-green-200">
              Active
            </Badge>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell text-sm">
          {/* Note: Active loan count might need to be fetched or stored if not on object. 
              The list query usually doesn't aggressively fetch this for perf unless computed. 
              But for now, assuming it's NOT on object yet? 
              Ah, 'students' list didn't have activeLoanCount by default unless the backend `list` query computes it.
              Checking `students.ts`: list/pagination queries in `students` DO NOT return loan counts currently.
              Wait, the previous `students.tsx` displayed checking `student.activeLoanCount`.
              Does the `students` table record have activeLoanCount? NO.
              The `getByStudentId` helper computes it.
              Current `paginatedList` implementation just returns the document.
              So loan count will be missing or undefined!
              This is a gap in my implementation request vs existing code.
              However, for now, let's stick to simple display or fetch loan count?
              Existing code: `student.activeLoanCount` was used.
              But `students.list` logic: Just returns `ctx.db.query("students")...`
              So existing code MIGHT have been broken or I missed something?
              Ah, existing code used `list` which just returns student docs.
              If `activeLoanCount` is not on the doc, it won't show.
              Actually, the user might have expected it.
              I should probably update the pagination queries to include this info or load it separately?
              Loading separately for each row is N+1 problem.
              Ideally, we should perhaps just show it in details view to avoid complexity, OR
              we can't easily do it efficiently in Convex without a dedicated field updated by triggers.
              For now, I'll render "-" if missing.
          */}
          {/* Placeholder for loan count if not available */}
          - / {faculty.borrowingLimit}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowEditDialog(true)}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`size-8 ${faculty.isBlocked ? "text-green-600" : "text-destructive"}`}
              onClick={handleToggleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : faculty.isBlocked ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconBan className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditFacultyDialog faculty={faculty} onClose={() => setShowEditDialog(false)} />
      </Dialog>
    </>
  );
}

function AddFacultyDialog({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const createFaculty = useMutation(api.faculty.create);

  const form = useForm({
    defaultValues: {
      facultyId: "",
      name: "",
      email: "",
      department: "",
      phone: "",
      borrowingLimit: 10,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = facultySchema.safeParse(value);
        if (!result.success) {
          return result.error.issues.map((e: any) => e.message).join(', ');
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true);
        await createFaculty({
          ...value,
          phone: value.phone || undefined,
        });
        toast.success("Faculty created successfully!");
        onClose();
      } catch (error: any) {
        toast.error("Failed to create faculty", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <DialogContent className="w-[95vw] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Faculty</DialogTitle>
        <DialogDescription>Enter faculty details.</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <form.Field
            name="facultyId"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Faculty ID *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="department"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Department *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
          <form.Field
            name="borrowingLimit"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Borrowing Limit *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  required
                />
              </div>
            )}
          />
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !canSubmit}
                className="flex-1"
              >
                {isLoading || isSubmitting ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditFacultyDialog({ faculty, onClose }: { faculty: any; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const updateFaculty = useMutation(api.faculty.update);
  const deleteFaculty = useMutation(api.faculty.remove);

  // Fetch detailed faculty info to check active loans for delete gating
  const facultyDetails = useQuery(api.faculty.getByFacultyId, { facultyId: faculty.facultyId });
  const hasActiveLoans = (facultyDetails?.activeLoanCount ?? 0) > 0;

  const form = useForm({
    defaultValues: {
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      phone: faculty.phone || "",
      borrowingLimit: faculty.borrowingLimit,
    },
    validators: {
      onSubmit: ({ value }) => {
        const schema = facultySchema.omit({ facultyId: true });
        const result = schema.safeParse(value);
        if (!result.success) {
          return result.error.issues.map((e: any) => e.message).join(', ');
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true);
        await updateFaculty({
          id: faculty._id as Id<"faculty">,
          ...value,
          phone: value.phone || undefined,
        });
        toast.success("Faculty updated successfully!");
        onClose();
      } catch (error: any) {
        toast.error("Failed to update faculty", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <>
    <DialogContent className="w-[95vw] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Faculty</DialogTitle>
        <DialogDescription>Update info.</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
          <form.Field
            name="department"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Department *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
          <form.Field
            name="borrowingLimit"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Borrowing Limit *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  required
                />
              </div>
            )}
          />
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !canSubmit}
                className="flex-1"
              >
                {isLoading || isSubmitting ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </form>

      {/* Delete button — separated below the form */}
      <div className="pt-2 border-t">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={hasActiveLoans}
          title={hasActiveLoans ? "Cannot delete: faculty has active loans. Return all books first." : undefined}
        >
          <IconTrash className="h-4 w-4 mr-2" />
          Delete Faculty
        </Button>
        {hasActiveLoans && (
          <p className="text-xs text-muted-foreground mt-1">
            Return {facultyDetails?.activeLoanCount} active loan(s) before deleting.
          </p>
        )}
      </div>
    </DialogContent>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <IconTrash className="h-5 w-5" />
            Delete Faculty
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold">{faculty.name}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                setIsDeleting(true);
                await deleteFaculty({ id: faculty._id as Id<"faculty"> });
                toast.success("Faculty deleted");
                setShowDeleteDialog(false);
                onClose();
              } catch (error: any) {
                toast.error("Failed to delete faculty", { description: error.message });
              } finally {
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Delete Faculty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>);
}
