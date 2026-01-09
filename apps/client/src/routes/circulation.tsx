import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@bookie/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bookie/ui/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bookie/ui/components/ui/dialog";
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconLoader2,
  IconRefresh,
  IconHistory,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { format, formatDistanceToNow } from "date-fns";
import { StudentScanner, BookScanner } from "@/components/scanner";

export const Route = createFileRoute("/circulation")({
  component: CirculationPage,
});

function CirculationPage() {
  return (
    <AppLayout title="Circulation">
      <CirculationContent />
    </AppLayout>
  );
}

function CirculationContent() {
  const [activeTab, setActiveTab] = useState<"checkout" | "checkin">("checkout");
  const recentTransactions = useQuery(api.transactions.getRecent, { limit: 5 });

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden sm:block">
        <p className="text-muted-foreground">
          Check out and check in books for students
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checkout" className="gap-2">
                <IconArrowUp className="h-4 w-4" />
                Check Out
              </TabsTrigger>
              <TabsTrigger value="checkin" className="gap-2">
                <IconArrowDown className="h-4 w-4" />
                Check In
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checkout" className="mt-6">
              <CheckoutFlow />
            </TabsContent>

            <TabsContent value="checkin" className="mt-6">
              <CheckinFlow />
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Activity Sidebar - Stacks on mobile */}
        <Card className="h-fit">
          <CardHeader className="pb-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IconHistory className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTransactions === undefined ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t: any) => (
                  <div
                    key={t._id}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors border sm:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {t.book?.title || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.student?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(t.checkoutDate), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge
                      variant={t.isReturned ? "secondary" : "default"}
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {t.isReturned ? "In" : "Out"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckoutFlow() {
  const [studentId, setStudentId] = useState("");
  const [bookAccession, setBookAccession] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const checkOut = useMutation(api.transactions.checkOut);

  // Real-time student lookup
  const studentData = useQuery(
    api.students.getByStudentId,
    studentId.trim() ? { studentId: studentId.trim() } : "skip"
  );

  // Real-time book lookup
  const bookData = useQuery(
    api.books.getByAccession,
    bookAccession.trim() ? { accessionNumber: bookAccession.trim() } : "skip"
  );

  const student = studentData;
  const book = bookData;

  // Validation logic
  const validationIssues: { type: "error" | "warning"; message: string }[] = [];

  if (student?.isBlocked) {
    validationIssues.push({
      type: "error",
      message: `Student is blocked${student.blockReason ? `: ${student.blockReason}` : ""}`,
    });
  }
  if (student?.hasOverdue) {
    validationIssues.push({
      type: "warning",
      message: "Student has overdue books",
    });
  }
  if (student && student.activeLoanCount >= student.borrowingLimit) {
    validationIssues.push({
      type: "error",
      message: `Borrowing limit reached (${student.activeLoanCount}/${student.borrowingLimit})`,
    });
  }
  if (book && book.status !== "available") {
    validationIssues.push({
      type: "error",
      message: `Book is ${book.status}`,
    });
  }

  const hasErrors = validationIssues.some((v) => v.type === "error");
  const canCheckout = student && book && !hasErrors;

  const handleCheckout = async () => {
    if (!student || !book) return;

    try {
      setIsLoading(true);
      const result = await checkOut({
        studentId: student._id as Id<"students">,
        bookId: book._id as Id<"books">,
        device: "admin_dashboard",
      });

      toast.success("Book checked out successfully!", {
        description: `Due: ${format(new Date(result.dueDate), "MMM d, yyyy")}`,
      });

      // Reset form
      setStudentId("");
      setBookAccession("");
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast.error("Checkout failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStudentId("");
    setBookAccession("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Scanner */}
        <div className="space-y-4">
          <StudentScanner
            onScan={(id) => setStudentId(id)}
            onError={(err) => toast.error("Scanner error", { description: err })}
          />

          {/* Student Preview */}
          {studentId && (
            <div>
              {studentData === undefined ? (
                <Card>
                  <CardContent className="py-4 flex items-center gap-2 text-muted-foreground text-sm">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Looking up student...
                  </CardContent>
                </Card>
              ) : student ? (
                <Card className={student.isBlocked ? "border-destructive bg-destructive/5" : ""}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{student.name}</span>
                      <Badge variant={student.isBlocked ? "destructive" : "secondary"} className="text-[10px]">
                        Grade {student.gradeLevel}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {student.studentId}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={student.activeLoanCount >= student.borrowingLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Books: {student.activeLoanCount}/{student.borrowingLimit}
                      </span>
                      {student.isBlocked && (
                        <span className="text-destructive flex items-center gap-1 font-medium">
                          <IconX className="h-3 w-3" /> Blocked
                        </span>
                      )}
                      {student.hasOverdue && (
                        <span className="text-amber-500 flex items-center gap-1 font-medium">
                          <IconAlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm font-medium">
                    <IconX className="h-4 w-4 shrink-0" />
                    Student not found: {studentId}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Book Scanner */}
        <div className="space-y-4">
          <BookScanner
            onScan={(acc) => setBookAccession(acc)}
            onError={(err) => toast.error("Scanner error", { description: err })}
          />

          {/* Book Preview */}
          {bookAccession && (
            <div>
              {bookData === undefined ? (
                <Card>
                  <CardContent className="py-4 flex items-center gap-2 text-muted-foreground text-sm">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Looking up book...
                  </CardContent>
                </Card>
              ) : book ? (
                <Card className={book.status !== "available" ? "border-amber-500 bg-amber-50/50" : ""}>
                  <CardContent className="py-4 space-y-2">
                    <div className="font-semibold text-sm line-clamp-2">{book.title}</div>
                    <div className="text-xs text-muted-foreground truncate">by {book.author}</div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span>Acc: {book.accessionNumber}</span>
                      <Badge
                        variant={book.status === "available" ? "default" : "secondary"}
                        className={book.status === "available" ? "bg-green-600 text-[10px]" : "text-[10px]"}
                      >
                        {book.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm font-medium">
                    <IconX className="h-4 w-4 shrink-0" />
                    Book not found: {bookAccession}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {validationIssues.length > 0 && (
        <Card className={hasErrors ? "border-destructive bg-destructive/5" : "border-amber-500 bg-amber-50/50"}>
          <CardContent className="py-4">
            <div className={`flex items-center gap-2 font-medium text-sm mb-2 ${hasErrors ? "text-destructive" : "text-amber-700"}`}>
              <IconAlertTriangle className="h-4 w-4" />
              {hasErrors ? "Issue Detected" : "Warning"}
            </div>
            <ul className="space-y-1">
              {validationIssues.map((issue, i) => (
                <li
                  key={i}
                  className={`text-xs flex items-start gap-2 ${issue.type === "error" ? "text-destructive" : "text-amber-700"}`}
                >
                  <span className="mt-0.5">•</span>
                  {issue.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={!canCheckout || isLoading}
          onClick={() => setShowConfirmDialog(true)}
        >
          <IconCheck className="mr-2 h-4 w-4" />
          Check Out Book
        </Button>
        {(studentId || bookAccession) && (
          <Button variant="outline" size="lg" onClick={handleReset}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              Check out this book to the student.
            </DialogDescription>
          </DialogHeader>

          {student && book && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Student</p>
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">Grade {student.gradeLevel}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Book</p>
                <p className="font-semibold text-sm line-clamp-1">{book.title}</p>
                <p className="text-xs text-muted-foreground">by {book.author}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckinFlow() {
  const [bookAccession, setBookAccession] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkIn = useMutation(api.transactions.checkIn);

  const bookData = useQuery(
    api.books.getByAccession,
    bookAccession.trim() ? { accessionNumber: bookAccession.trim() } : "skip"
  );

  const book = bookData;

  const handleCheckin = async () => {
    if (!book) return;

    try {
      setIsLoading(true);
      const result = await checkIn({
        bookId: book._id as Id<"books">,
        device: "admin_dashboard",
      });

      if (result.wasOverdue) {
        toast.warning("Book returned late", {
          description: `${result.daysOverdue} days overdue`,
        });
      } else {
        toast.success("Book checked in successfully!");
      }

      setBookAccession("");
    } catch (error: any) {
      toast.error("Check-in failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <BookScanner
        onScan={(acc) => setBookAccession(acc)}
        onError={(err) => toast.error("Scanner error", { description: err })}
      />

      {/* Book Preview */}
      {bookAccession && (
        <div>
          {bookData === undefined ? (
            <Card>
              <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <IconLoader2 className="h-5 w-5 animate-spin" />
                Looking up book...
              </CardContent>
            </Card>
          ) : book ? (
            <Card className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="font-semibold text-base line-clamp-2">{book.title}</div>
                  <div className="text-xs text-muted-foreground">by {book.author}</div>
                  <div className="text-[10px] text-muted-foreground bg-muted w-fit px-1.5 py-0.5 rounded mt-1">
                    Acc: {book.accessionNumber}
                  </div>
                </div>

                {book.currentLoan && (
                  <div className="p-3 bg-muted rounded-lg space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Currently With</div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{book.currentLoan.student?.name}</span>
                      <span className={`text-[10px] ${book.currentLoan.dueDate < Date.now() ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        Due: {format(new Date(book.currentLoan.dueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {book.currentLoan.dueDate < Date.now() && (
                      <Badge variant="destructive" className="w-full text-[10px] py-0">OVERDUE</Badge>
                    )}
                  </div>
                )}

                {book.status === "available" && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded text-green-700 dark:text-green-400 text-xs">
                    This book is already available (not checked out)
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  disabled={book.status !== "borrowed" || isLoading}
                  onClick={handleCheckin}
                >
                  {isLoading ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <IconCheck className="mr-2 h-4 w-4" />
                      Check In Book
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm font-medium">
                <IconX className="h-4 w-4 shrink-0" />
                Book not found: {bookAccession}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

