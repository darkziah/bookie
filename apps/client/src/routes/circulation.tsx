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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@bookie/ui/components/ui/collapsible";
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
import { Checkbox } from "@bookie/ui/components/ui/checkbox";
import { Label } from "@bookie/ui/components/ui/label";
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
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
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
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const recentTransactions = useQuery(api.transactions.getRecent, { limit: 5 });

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden sm:block">
        <p className="text-muted-foreground">
          Check out and check in books for students
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0 space-y-6">
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

        {/* Recent Activity Sidebar - Stacks on mobile, Collapses on desktop */}
        <Collapsible
          open={isActivityOpen}
          onOpenChange={setIsActivityOpen}
          className={`shrink-0 transition-all duration-300 ease-in-out ${isActivityOpen ? "w-full lg:w-80" : "w-full lg:w-16 h-fit"}`}
        >
          {/* Desktop Collapsed Strip */}
          {!isActivityOpen && (
            <div className="hidden lg:flex flex-col items-center py-2 gap-4 bg-muted/30 rounded-lg border h-full min-h-[200px]">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => setIsActivityOpen(true)}
                title="Expand Activity"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div
                className="flex flex-col items-center gap-2 cursor-pointer py-4 flex-1 hover:text-primary transition-colors"
                onClick={() => setIsActivityOpen(true)}
              >
                <IconHistory className="h-5 w-5" />
                <span
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground select-none"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  Recent Activity
                </span>
              </div>
            </div>
          )}

          {/* Main Card Content */}
          <Card className={`transition-all duration-300 ${!isActivityOpen ? "lg:hidden" : ""}`}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <div className="flex items-center gap-2">
                    <IconHistory className="h-5 w-5 text-primary" />
                    <span className="whitespace-nowrap">Recent Activity</span>
                  </div>
                  <div>
                    {/* Mobile Chevron */}
                    <IconChevronDown
                      className={`lg:hidden h-4 w-4 text-muted-foreground transition-transform duration-200 ${isActivityOpen ? "rotate-180" : ""
                        }`}
                    />
                    {/* Desktop Chevron */}
                    <IconChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground" />
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}

function CheckoutFlow() {
  const [patronType, setPatronType] = useState<"student" | "faculty">("student");
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [bookAccession, setBookAccession] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [overrideLimits, setOverrideLimits] = useState(false);

  const checkOut = useMutation(api.transactions.checkOut);


  // Real-time student lookup
  const studentData = useQuery(
    api.students.getByStudentId,
    studentId.trim() && patronType === "student" ? { studentId: studentId.trim() } : "skip"
  );

  // Real-time faculty lookup
  const facultyData = useQuery(
    api.faculty.getByFacultyId,
    facultyId.trim() && patronType === "faculty" ? { facultyId: facultyId.trim() } : "skip"
  );

  // Real-time book lookup
  const bookData = useQuery(
    api.books.getByAccession,
    bookAccession.trim() ? { accessionNumber: bookAccession.trim() } : "skip"
  );

  const patron = patronType === "student" ? studentData : facultyData;
  const isPatronLoading = patronType === "student" ? studentData === undefined : facultyData === undefined;
  const patronId = patronType === "student" ? studentId : facultyId;
  const book = bookData;

  // Validation logic
  const validationIssues: { type: "error" | "warning"; message: string }[] = [];

  if (patron?.isBlocked) {
    validationIssues.push({
      type: "error",
      message: `${patronType === "student" ? "Student" : "Faculty"} is blocked${patron.blockReason ? `: ${patron.blockReason}` : ""}`,
    });
  }
  if (patron?.hasOverdue) {
    validationIssues.push({
      type: "warning",
      message: `${patronType === "student" ? "Student" : "Faculty"} has overdue books`,
    });
  }
  if (patron && patron.activeLoanCount >= patron.borrowingLimit) {
    validationIssues.push({
      type: overrideLimits ? "warning" : "error",
      message: `Borrowing limit reached (${patron.activeLoanCount}/${patron.borrowingLimit})${overrideLimits ? " - Override Active" : ""}`,
    });
  }
  if (book && book.status !== "available") {
    validationIssues.push({
      type: "error",
      message: `Book is ${book.status}`,
    });
  }

  const hasErrors = validationIssues.some((v) => v.type === "error");
  const canCheckout = patron && book && !hasErrors;

  const handleCheckout = async () => {
    if (!patron || !book) return;

    try {
      setIsLoading(true);
      const args: any = {
        bookId: book._id as Id<"books">,
        device: "admin_dashboard",
        overrideLimits,
      };

      if (patronType === "student") {
        args.studentId = patron._id as Id<"students">;
      } else {
        args.facultyId = patron._id as Id<"faculty">;
      }

      const result = await checkOut(args);

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
    setFacultyId("");
    setBookAccession("");
    setOverrideLimits(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="font-medium text-sm">Patron</h3>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            className={`text-xs px-3 py-1 rounded-md transition-all ${patronType === "student" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setPatronType("student"); setFacultyId(""); }}
          >
            Student
          </button>
          <button
            className={`text-xs px-3 py-1 rounded-md transition-all ${patronType === "faculty" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setPatronType("faculty"); setStudentId(""); }}
          >
            Faculty
          </button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Patron Scanner */}
        <div className="space-y-4">


          <StudentScanner
            label={patronType === "student" ? "Scan Student ID" : "Scan Faculty ID"}
            onScan={(id) => patronType === "student" ? setStudentId(id) : setFacultyId(id)}
            onError={(err) => toast.error("Scanner error", { description: err })}
          />

          {/* Patron Preview */}
          {patronId && (
            <div>
              {isPatronLoading ? (
                <Card>
                  <CardContent className="py-4 flex items-center gap-2 text-muted-foreground text-sm">
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Looking up {patronType}...
                  </CardContent>
                </Card>
              ) : patron ? (
                <Card className={patron.isBlocked ? "border-destructive bg-destructive/5" : ""}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{patron.name}</span>
                      <Badge variant={patron.isBlocked ? "destructive" : "secondary"} className="text-[10px]">
                        {patronType === "student" ? `Grade ${(patron as any).gradeLevel}` : (patron as any).department || "Faculty"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {patronType === "student" ? (patron as any).studentId : (patron as any).facultyId}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={patron.activeLoanCount >= patron.borrowingLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Books: {patron.activeLoanCount}/{patron.borrowingLimit}
                      </span>
                      {patron.isBlocked && (
                        <span className="text-destructive flex items-center gap-1 font-medium">
                          <IconX className="h-3 w-3" /> Blocked
                        </span>
                      )}
                      {patron.hasOverdue && (
                        <span className="text-amber-500 flex items-center gap-1 font-medium">
                          <IconAlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                      {((patron as any).outstandingFees ?? 0) > 0 && (
                        <span className="text-red-600 font-medium">
                          Balance: ₱{((patron as any).outstandingFees ?? 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="py-4 flex items-center gap-2 text-destructive text-sm font-medium">
                    <IconX className="h-4 w-4 shrink-0" />
                    {patronType === "student" ? "Student" : "Faculty"} not found: {patronId}
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

      {/* Override Option */}
      {patron && patron.activeLoanCount >= patron.borrowingLimit && (
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="override-limit"
            checked={overrideLimits}
            onCheckedChange={(c: boolean) => setOverrideLimits(c)}
            className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
          />
          <Label
            htmlFor="override-limit"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-700"
          >
            Override borrowing limit
          </Label>
        </div>
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
        {(patronId || bookAccession) && (
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

          {patron && book && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{patronType}</p>
                <p className="font-semibold text-sm">{patron.name}</p>
                <p className="text-xs text-muted-foreground">{patronType === "student" ? `Grade ${(patron as any).gradeLevel}` : (patron as any).department}</p>
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

