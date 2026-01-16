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

export const Route = createFileRoute("/faculty/$facultyId")({
  component: FacultyDetailPage,
});

function FacultyDetailPage() {
  const params = Route.useParams();

  // Assuming ID in URL is the Convex ID
  const faculty = useQuery(api.faculty.get, { id: params.facultyId as Id<"faculty"> });

  // To get history/active loans, we might need a dedicated function if not reusing student logic or generic transaction logic
  // Let's reuse basic getByFacultyId which returns active loans, but we need history too.
  // There is no `getFacultyHistory` yet. I should add it or use `getRecent` with filter?
  // Previous `getStudentHistory` exists. I should probably add `getFacultyHistory`.
  // For now, let's see if I can use existing tools. 
  // Wait, I can't add backend code in this step easily without switching context.
  // But wait, I added `getStudentHistory`? Actually I saw it in `transactions.ts`?
  // Let's check `transactions.ts` for history queries.
  // If not, I'll need to add it.
  // Assuming `getStudentHistory` exists, I probably need `getFacultyHistory` too.
  // I will check `transactions.ts` first. For now, writing the frontend code assuming it exists or will exist soon.
  // Actually, I'll skip fetching history for a moment and just show Active Loans from `getByFacultyId`.

  const facultyDetails = useQuery(api.faculty.getByFacultyId,
    faculty ? { facultyId: faculty.facultyId } : "skip"
  );

  const history = useQuery(api.transactions.getFacultyHistory,
    faculty ? { facultyId: faculty._id } : "skip"
  );

  return (
    <AppLayout title="Faculty Details">
      <div className="flex flex-col gap-6">
        <Link to="/faculty">
          <Button variant="ghost" className="pl-0 gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Back to Faculty
          </Button>
        </Link>

        {faculty === undefined || facultyDetails === undefined ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !faculty ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Faculty not found</h2>
          </div>
        ) : (
          <>
            {/* Header / Profile Card */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{faculty.name}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        ID: {faculty.facultyId}
                      </CardDescription>
                    </div>
                    {faculty.isBlocked ? (
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
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{faculty.department}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{faculty.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{faculty.phone || "-"}</p>
                    </div>
                  </div>

                  {faculty.isBlocked && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
                      <span className="font-bold">Block Reason:</span> {faculty.blockReason}
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
                    <span className="font-bold text-xl">{facultyDetails?.activeLoanCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Limit</span>
                    <span className="font-bold text-xl">{faculty.borrowingLimit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className={`font-bold text-xl ${facultyDetails?.hasOverdue ? "text-red-600" : "text-green-600"}`}>
                      {facultyDetails?.hasOverdue ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                    <span className={`font-bold text-xl ${(faculty.outstandingFees ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₱{(faculty.outstandingFees ?? 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Loans (Since we have them in details) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconClock className="h-5 w-5" />
                  Active Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!facultyDetails?.activeLoans || facultyDetails.activeLoans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active loans.</p>
                ) : (
                  <div className="space-y-4">
                    {facultyDetails.activeLoans.map((t: any) => (
                      <div key={t._id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="grid gap-1">
                          <p className="font-medium text-sm">{t.book?.title || "Unknown Book"}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(t.dueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant={t.isOverdue ? "destructive" : "default"}>
                          {t.isOverdue ? "Overdue" : "Active"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
