import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconArrowLeft,
  IconLoader2,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck
} from "@tabler/icons-react";
import { Button } from "@bookie/ui/components/ui/button";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";

export const Route = createFileRoute("/student/$studentId")({
  component: StudentDetailPage,
});

function StudentDetailPage() {
  const params = Route.useParams();

  // Need to find the student first by their readable ID or query param?
  // Actually, typically we route by internal ID or we lookup by studentId.
  // Assuming the route param is the INTERNAL ID (convex ID) for simplicity in fetching,
  // or we can fetch by studentId (string). Use internal ID for specific resource usually.
  // BUT wait, existing students list uses `student._id` I assume. Let's assume url is /students/<internal_id>

  const student = useQuery(api.students.get, { id: params.studentId as Id<"students"> });
  const history = useQuery(api.transactions.getStudentHistory,
    student ? { studentId: student._id } : "skip"
  );
  const studentDetails = useQuery(api.students.getByStudentId,
    student ? { studentId: student.studentId } : "skip"
  );

  return (
    <AppLayout title="Student Details">
      <div className="flex flex-col gap-6">
        <Link to="/student">
          <Button variant="ghost" className="pl-0 gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
        </Link>

        {student === undefined || studentDetails === undefined ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !student ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Student not found</h2>
          </div>
        ) : (
          <>
            {/* Header / Profile Card */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{student.name}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        ID: {student.studentId}
                      </CardDescription>
                    </div>
                    {student.isBlocked ? (
                      <Badge variant="destructive" className="text-sm px-3 py-1">
                        <IconAlertTriangle className="mr-1 h-3.5 w-3.5" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200">
                        <IconCircleCheck className="mr-1 h-3.5 w-3.5" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Grade Level</p>
                      <p className="font-medium">Grade {student.gradeLevel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Section</p>
                      <p className="font-medium">{student.section || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">{student.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Guardian</p>
                      <p className="font-medium">{student.guardian || "-"} {student.guardianPhone ? `(${student.guardianPhone})` : ""}</p>
                    </div>
                  </div>

                  {student.isBlocked && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
                      <span className="font-bold">Block Reason:</span> {student.blockReason}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Borrowing Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Loans</span>
                    <span className="font-bold text-xl">{studentDetails?.activeLoanCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Limit</span>
                    <span className="font-bold text-xl">{student.borrowingLimit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className={`font-bold text-xl ${studentDetails?.hasOverdue ? "text-red-600" : "text-green-600"}`}>
                      {studentDetails?.hasOverdue ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                    <span className={`font-bold text-xl ${(student.outstandingFees ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₱{(student.outstandingFees ?? 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Borrowing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClock className="h-5 w-5" />
                  Borrowing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history === undefined ? (
                  <div className="py-8 flex justify-center">
                    <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No borrowing history.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((t: any) => (
                      <div key={t._id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="grid gap-1">
                          <p className="font-medium text-sm">{t.book?.title || "Unknown Book"}</p>
                          <p className="text-xs text-muted-foreground">
                            Out: {format(new Date(t.checkoutDate), "MMM d, yyyy")}
                            {t.returnDate && ` • In: ${format(new Date(t.returnDate), "MMM d, yyyy")}`}
                          </p>
                        </div>
                        <Badge variant={t.isReturned ? "secondary" : "default"}>
                          {t.isReturned ? "Returned" : "Active"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
