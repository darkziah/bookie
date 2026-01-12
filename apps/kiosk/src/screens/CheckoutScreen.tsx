import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Book, User, CheckCircle2, XCircle, ScanLine, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { KioskScanner } from "../components/kiosk-scanner";

interface CheckoutScreenProps {
  studentId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function CheckoutScreen({ studentId, onComplete, onCancel }: CheckoutScreenProps) {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Override state
  const [showOverrideScanner, setShowOverrideScanner] = useState(false);
  const [overrideLibrarian, setOverrideLibrarian] = useState<{ _id: string; name: string } | null>(null);
  const [isVerifyingLibrarian, setIsVerifyingLibrarian] = useState(false);

  const verifyLibrarian = useMutation(api.kiosk.verifyLibrarian);

  const student = useQuery(api.kiosk.getStudentById, { studentId });

  // Detect code type when scanned
  const codeResult = useQuery(
    api.kiosk.detectCodeType,
    scannedCode ? { code: scannedCode } : "skip"
  );

  // Get paginated books when ISBN is detected
  const isbnBooks = useQuery(
    api.kiosk.getBooksByIsbnPaginated,
    codeResult?.type === "isbn" ? { isbn: codeResult.code, cursor, limit: 6 } : "skip"
  );

  const checkout = useMutation(api.kiosk.checkout);

  const handleScan = (code: string) => {
    setScannedCode(code);
    setSelectedBookId(null);
    setCursor(undefined);
  };

  const handleStaffScan = async (code: string) => {
    setIsVerifyingLibrarian(true);
    try {
      const librarian = await verifyLibrarian({ code });
      setOverrideLibrarian(librarian);
      setShowOverrideScanner(false);
      toast.success(`Override authorized by ${librarian.name}`);
    } catch (error: any) {
      toast.error(error.message || "Invalid Staff ID");
    } finally {
      setIsVerifyingLibrarian(false);
    }
  };

  const handleCheckout = async (accessionNumber: string) => {
    if (!student) return;

    setIsLoading(true);
    try {
      await checkout({
        studentId: student._id,
        accessionNumber,
        overrideLibrarianId: overrideLibrarian?._id as any, // Cast to any or Id if needed
      });
      toast.success("Checkout Successful!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      // Reset for another try
      setScannedCode(null);
      setSelectedBookId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelScan = () => {
    setScannedCode(null);
    setSelectedBookId(null);
    setCursor(undefined);
  };

  const loadMore = () => {
    if (isbnBooks?.nextCursor) {
      setCursor(isbnBooks.nextCursor);
    }
  };

  if (student === undefined) {
    return (
      <div className="text-center">
        <Loader2 className="size-20 animate-spin text-primary mx-auto" />
        <p className="text-2xl font-medium text-muted-foreground mt-6">Verifying Identity...</p>
      </div>
    );
  }

  if (student === null) {
    return (
      <Card className="w-full max-w-2xl border-destructive/20 shadow-2xl bg-destructive/5">
        <CardContent className="pt-10 text-center">
          <XCircle className="size-24 text-destructive mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-destructive mb-2">Student Not Found</h2>
          <p className="text-xl text-muted-foreground mb-10">We couldn't find a student with ID: <span className="font-mono font-bold text-foreground">{studentId}</span></p>
          <Button
            size="kiosk"
            variant="destructive"
            onClick={onCancel}
            className="w-full"
          >
            Try Another ID
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render book card helper
  const renderBookCard = (book: {
    _id: string;
    title: string;
    author: string;
    isbn?: string;
    accessionNumber: string;
    status: string;
    location?: string;
  }, isSelected: boolean = false) => (
    <div
      key={book._id}
      className={`bg-muted/50 rounded-xl p-4 border-2 cursor-pointer transition-all hover:border-primary/50 ${isSelected ? "border-primary bg-primary/5" : "border-transparent"
        } ${book.status !== "available" ? "opacity-60" : ""}`}
      onClick={() => book.status === "available" && setSelectedBookId(book._id)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-lg ${book.status === "available" ? "bg-green-500/10" : "bg-muted"}`}>
          <Book className={`size-8 ${book.status === "available" ? "text-green-600" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-foreground truncate">{book.title}</h4>
          <p className="text-muted-foreground text-sm truncate">by {book.author}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-card px-2 py-0.5 rounded text-xs font-mono border">
              {book.accessionNumber}
            </span>
            {book.location && (
              <span className="bg-card px-2 py-0.5 rounded text-xs border">
                📍 {book.location}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${book.status === "available"
              ? "bg-green-500/10 text-green-600"
              : "bg-amber-500/10 text-amber-600"
              }`}>
              {book.status}
            </span>
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 className="size-6 text-primary flex-shrink-0" />
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Student Profile Card (Compact) */}
      {/* <Card className="border-primary/20 bg-primary/5 shadow-lg">
        <CardContent className="py-4 flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-xl">
            <User className="size-10 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold uppercase">
                Grade {student.gradeLevel}
              </span>
              <span className="text-muted-foreground text-sm">ID: {student.studentId}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {student.activeLoanCount}/{student.borrowingLimit} books
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={onCancel} className="h-12">
            End Session
          </Button>
        </CardContent>
      </Card> */}

      {/* Book Scanner / Preview Card */}
      <Card className="border-2 shadow-2xl">

        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-3">
            {showOverrideScanner ? (
              <ShieldCheck className="size-10 text-primary" />
            ) : (
              <ScanLine className="size-10 text-green-600" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold">
            {showOverrideScanner
              ? "Staff Authorization"
              : (student.activeLoanCount >= student.borrowingLimit && !overrideLibrarian
                ? "Limit Reached"
                : "Scan Book")}
          </CardTitle>
          <CardDescription className="text-lg">
            {showOverrideScanner
              ? "Please scan your Staff ID to authorize this exception"
              : (student.activeLoanCount >= student.borrowingLimit && !overrideLibrarian
                ? "Borrowing limit has been reached"
                : "Scan ISBN barcode or accession number label")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">


          {/* Borrowing Limit Reached - Override Flow */}
          {student.activeLoanCount >= student.borrowingLimit && !overrideLibrarian ? (
            showOverrideScanner ? (
              <KioskScanner
                onScan={handleStaffScan}
                onError={(error) => toast.error(error)}
                placeholder="Scan Staff ID"
                title="Staff Override"
                description="Librarian must scan their ID to authorize additional checkouts"
                isVerifying={isVerifyingLibrarian}
              />
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                  <AlertCircle className="size-12 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-destructive mb-2">Borrowing Limit Reached</h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
                  You have borrowed <span className="font-bold text-foreground">{student.activeLoanCount}</span> out of <span className="font-bold text-foreground">{student.borrowingLimit}</span> allowed books.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button size="lg" variant="outline" onClick={onCancel} className="h-14 px-6 text-lg">
                    Return Home
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowOverrideScanner(true)}
                    className="h-14 px-6 text-lg border-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <ShieldCheck className="mr-2 size-5" /> Authorize Exception
                  </Button>
                </div>
              </div>
            )
          ) : (
            /* No book scanned yet - show scanner */
            !scannedCode && (
              <div className="space-y-4">
                {overrideLibrarian && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <ShieldCheck className="size-5" />
                      Override Active: Authorized by {overrideLibrarian.name}
                    </div>
                  </div>
                )}
                <KioskScanner
                  onScan={handleScan}
                  onError={(error) => toast.error(error)}
                  placeholder="ISBN or Accession Number"
                  title="Scan Book Barcode"
                  description="Align ISBN or accession barcode within frame"
                />
              </div>
            )
          )}

          {/* Code scanned - loading */}
          {scannedCode && codeResult === undefined && (
            <div className="text-center py-12">
              <Loader2 className="size-16 animate-spin text-primary mx-auto" />
              <p className="text-xl text-muted-foreground mt-4">Looking up book...</p>
              <p className="text-muted-foreground font-mono mt-2">{scannedCode}</p>
            </div>
          )}

          {/* Code not found */}
          {scannedCode && codeResult?.type === "unknown" && (
            <div className="text-center py-10">
              <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                <XCircle className="size-12 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold text-destructive mb-2">Book Not Found</h3>
              <p className="text-lg text-muted-foreground mb-2">
                No book found with code:
              </p>
              <p className="text-xl font-mono font-bold text-foreground mb-6">{scannedCode}</p>
              <Button size="lg" onClick={handleCancelScan} className="h-14 px-8 text-lg">
                Scan Another Book
              </Button>
            </div>
          )}

          {/* Accession number found - single book */}
          {scannedCode && codeResult?.type === "accession" && codeResult.book && (
            <div className="space-y-6">
              {renderBookCard(codeResult.book, true)}

              {/* Status Warning */}
              {codeResult.book.status !== "available" && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="size-6 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    This book is currently <strong>{codeResult.book.status}</strong> and cannot be checked out.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancelScan}
                  className="flex-1 h-16 text-xl"
                  disabled={isLoading}
                >
                  Scan Different Book
                </Button>
                <Button
                  onClick={() => handleCheckout(codeResult.book!.accessionNumber)}
                  className="flex-1 h-16 text-xl bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all"
                  disabled={codeResult.book.status !== "available" || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin size-6" />
                  ) : (
                    <>Confirm Checkout <CheckCircle2 className="ml-2 size-6" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ISBN found - show all copies with pagination */}
          {scannedCode && codeResult?.type === "isbn" && (
            <div className="space-y-6">
              {/* ISBN Header */}
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">ISBN Detected</p>
                    <p className="font-mono text-foreground text-xl">{codeResult.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{codeResult.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {codeResult.availableCount} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading books */}
              {isbnBooks === undefined && (
                <div className="text-center py-8">
                  <Loader2 className="size-10 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground mt-3">Loading copies...</p>
                </div>
              )}

              {/* Books list */}
              {isbnBooks && (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {isbnBooks.books.map((book) =>
                      renderBookCard(book, selectedBookId === book._id)
                    )}
                  </div>

                  {/* Pagination */}
                  {isbnBooks.hasMore && (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      className="w-full"
                    >
                      Load More Copies
                    </Button>
                  )}

                  {/* Selection info */}
                  {selectedBookId && (
                    <div className="text-center text-muted-foreground">
                      Selected: <span className="font-mono font-bold text-foreground">
                        {isbnBooks.books.find(b => b._id === selectedBookId)?.accessionNumber}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancelScan}
                  className="flex-1 h-16 text-xl"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const selectedBook = isbnBooks?.books.find(b => b._id === selectedBookId);
                    if (selectedBook) {
                      handleCheckout(selectedBook.accessionNumber);
                    }
                  }}
                  className="flex-1 h-16 text-xl bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all"
                  disabled={!selectedBookId || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin size-6" />
                  ) : (
                    <>Checkout Selected <CheckCircle2 className="ml-2 size-6" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
