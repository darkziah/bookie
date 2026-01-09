import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/students")({
  component: StudentsPage,
});

function StudentsPage() {
  return (
    <AppLayout title="Students">
      <StudentsContent />
    </AppLayout>
  );
}

function StudentsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const studentsData = useQuery(api.students.list, {
    gradeLevel: gradeFilter ? Number(gradeFilter) : undefined,
  });

  const searchResults = useQuery(
    api.students.search,
    searchQuery.trim().length >= 2 ? { searchTerm: searchQuery.trim() } : "skip"
  );

  const statsData = useQuery(api.students.getStats, {});

  const students = searchQuery.trim().length >= 2 ? searchResults : studentsData;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground">Manage student records and borrowing status</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <AddStudentDialog onClose={() => setShowAddDialog(false)} />
        </Dialog>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
          <div className="text-xl sm:text-2xl font-bold">
            {statsData?.total ?? <IconLoader2 className="h-4 w-4 animate-spin" />}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</span>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {statsData?.active ?? "-"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocked</span>
          <div className="text-xl sm:text-2xl font-bold text-destructive">
            {statsData?.blocked ?? "0"}
          </div>
        </Card>
      </div>

      {/* Filters - Responsive layout */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {[...Array(12)].map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Grade {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table - With overflow scroll */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {students === undefined ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <IconUser className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No students found</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {searchQuery ? "Try a different search term" : "Add your first student to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Loans</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <StudentRow key={student._id} student={student} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentRow({ student }: { student: any }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const blockStudent = useMutation(api.students.block);
  const unblockStudent = useMutation(api.students.unblock);

  const handleToggleBlock = async () => {
    try {
      setIsBlocking(true);
      if (student.isBlocked) {
        await unblockStudent({ id: student._id as Id<"students"> });
        toast.success("Student unblocked");
      } else {
        await blockStudent({
          id: student._id as Id<"students">,
          reason: "Blocked by librarian",
        });
        toast.success("Student blocked");
      }
    } catch (error: any) {
      toast.error("Failed to update student status", { description: error.message });
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs sm:text-sm">{student.studentId}</TableCell>
        <TableCell>
          <div className="font-medium text-sm sm:text-base">{student.name}</div>
          <div className="md:hidden text-[10px] text-muted-foreground">
            Grade {student.gradeLevel} {student.section ? `• ${student.section}` : ""}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell text-sm">
          Grade {student.gradeLevel}
          {student.section && <div className="text-[10px] text-muted-foreground">{student.section}</div>}
        </TableCell>
        <TableCell>
          {student.isBlocked ? (
            <Badge variant="destructive" className="text-[10px] py-0">Blocked</Badge>
          ) : student.hasOverdue ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] py-0 border-amber-200">
              Overdue
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] py-0 border-green-200">
              Active
            </Badge>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell text-sm">
          {student.activeLoanCount}/{student.borrowingLimit}
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
              className={`size-8 ${student.isBlocked ? "text-green-600" : "text-destructive"}`}
              onClick={handleToggleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : student.isBlocked ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconBan className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditStudentDialog student={student} onClose={() => setShowEditDialog(false)} />
      </Dialog>
    </>
  );
}

function AddStudentDialog({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    gradeLevel: "",
    section: "",
    contactNumber: "",
  });

  const createStudent = useMutation(api.students.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await createStudent({
        studentId: formData.studentId,
        name: formData.name,
        gradeLevel: Number(formData.gradeLevel),
        section: formData.section || undefined,
        phone: formData.contactNumber || undefined,
      });
      toast.success("Student created successfully!");
      onClose();
    } catch (error: any) {
      toast.error("Failed to create student", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogDescription>Enter the student's details to register them.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID *</Label>
            <Input
              id="studentId"
              placeholder="e.g., 2024-0001"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Juan Dela Cruz"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(v) => setFormData({ ...formData, gradeLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                placeholder="Faith"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              placeholder="0912..."
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="flex-row gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.studentId || !formData.name || !formData.gradeLevel} className="flex-1">
            {isLoading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditStudentDialog({ student, onClose }: { student: any; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    gradeLevel: String(student.gradeLevel),
    section: student.section || "",
    contactNumber: student.contactNumber || "",
  });

  const updateStudent = useMutation(api.students.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await updateStudent({
        id: student._id as Id<"students">,
        name: formData.name,
        gradeLevel: Number(formData.gradeLevel),
        section: formData.section || undefined,
        phone: formData.contactNumber || undefined,
      });
      toast.success("Student updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error("Failed to update student", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogDescription>Update {student.name}'s information.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Student ID</Label>
            <Input value={student.studentId} disabled className="bg-muted opacity-80" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(v) => setFormData({ ...formData, gradeLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="flex-row gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

