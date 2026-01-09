import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Book, User, CheckCircle2, XCircle, ArrowRight, Home } from "lucide-react";

const IDLE_TIMEOUT = 30000; // 30 seconds

type Screen = "welcome" | "scan_student" | "checkout" | "success";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [studentId, setStudentId] = useState("");
  const [bookId, setBookId] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Reset to welcome screen after inactivity
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT && screen !== "welcome") {
        setScreen("welcome");
        setStudentId("");
        setBookId("");
        toast.info("Session timed out");
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [lastActivity, screen]);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Global touch/click handler to reset activity
  useEffect(() => {
    const handler = () => resetActivity();
    window.addEventListener("touchstart", handler);
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [resetActivity]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="p-6 text-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
          <Book className="size-10 text-primary" />
          BOOKIE <span className="text-primary">KIOSK</span>
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">Student Self-Service Terminal</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 max-w-5xl mx-auto w-full">
        {screen === "welcome" && (
          <WelcomeScreen onStart={() => {
            setScreen("scan_student");
            resetActivity();
          }} />
        )}
        {screen === "scan_student" && (
          <ScanStudentScreen
            onScan={(id) => {
              setStudentId(id);
              setScreen("checkout");
              resetActivity();
            }}
            onCancel={() => setScreen("welcome")}
          />
        )}
        {screen === "checkout" && (
          <CheckoutScreen
            studentId={studentId}
            onComplete={() => setScreen("success")}
            onCancel={() => setScreen("welcome")}
          />
        )}
        {screen === "success" && (
          <SuccessScreen onDone={() => {
            setScreen("welcome");
            setStudentId("");
            setBookId("");
          }} />
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-muted-foreground text-sm border-t border-border bg-card/30">
        Touch screen to interact • Auto-logout after 30 seconds of inactivity
      </footer>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <div className="w-48 h-48 mx-auto mb-10 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-ring relative">
        <Book className="size-24 text-primary relative z-10" />
      </div>
      <h2 className="text-6xl font-black text-foreground mb-4 tracking-tight">Ready to Read?</h2>
      <p className="text-2xl text-muted-foreground mb-12">Tap the button below to start your session</p>
      <Button
        size="kiosk"
        onClick={onStart}
        className="px-20 h-24 text-3xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        START SESSION
      </Button>
    </div>
  );
}

function ScanStudentScreen({ onScan, onCancel }: {
  onScan: (id: string) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onScan(input.trim());
    }
  };

  return (
    <Card className="w-full max-w-2xl border-2 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
          <User className="size-12 text-primary" />
        </div>
        <CardTitle className="text-4xl font-bold">Identity Verification</CardTitle>
        <CardDescription className="text-xl">Please scan your student ID or enter it manually</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Student ID Number"
            autoFocus
            className="h-20 text-3xl text-center font-mono border-2 focus-visible:ring-primary focus-visible:border-primary"
          />
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-16 text-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-16 text-xl"
              disabled={!input.trim()}
            >
              Continue <ArrowRight className="ml-2 size-6" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CheckoutScreen({ studentId, onComplete, onCancel }: {
  studentId: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [bookInput, setBookInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Using the new API paths if they were updated, or sticking to what works
  // Based on context7 or prior knowledge of the project
  const student = useQuery(api.kiosk.getStudentById, { studentId });
  const checkout = useMutation(api.kiosk.checkout);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookInput.trim() || !student) return;

    setIsLoading(true);
    try {
      await checkout({
        studentId: student._id,
        accessionNumber: bookInput.trim(),
      });
      toast.success("Checkout Successful!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Student Profile Card */}
      <Card className="border-primary/20 bg-primary/5 shadow-xl">
        <CardContent className="pt-8 flex items-center gap-6">
          <div className="bg-primary/20 p-4 rounded-2xl">
            <User className="size-16 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-black text-foreground">{student.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider">
                Grade {student.gradeLevel}
              </span>
              <span className="text-muted-foreground font-mono">ID: {student.studentId}</span>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-primary font-bold">
                <CheckCircle2 className="size-4" />
                Borrowing Limit: {student.borrowingLimit} books
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Checkout Card */}
      <Card className="border-2 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
            <Book className="size-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Scan Book Barcode</CardTitle>
          <CardDescription className="text-lg">Scan the book's accession number or barcode</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCheckout} className="space-y-6">
            <Input
              type="text"
              value={bookInput}
              onChange={(e) => setBookInput(e.target.value)}
              placeholder="Book Accession Number"
              autoFocus
              className="h-20 text-3xl text-center font-mono border-2 focus-visible:ring-green-500 focus-visible:border-green-500"
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-16 text-xl"
              >
                End Session
              </Button>
              <Button
                type="submit"
                className="flex-1 h-16 text-xl bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all"
                disabled={!bookInput.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin size-6" />
                ) : (
                  <>Checkout Book <CheckCircle2 className="ml-2 size-6" /></>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="text-center py-12">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <CheckCircle2 className="size-56 text-green-500 mx-auto relative drop-shadow-2xl" />
      </div>
      <h2 className="text-7xl font-black text-foreground mb-4 tracking-tighter">Enjoy your book!</h2>
      <p className="text-3xl text-muted-foreground mb-16 max-w-2xl mx-auto">Borrowing was successful. Remember to return it on time!</p>

      <div className="space-y-6">
        <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Next student can start in a few seconds...
        </p>
        <Button
          size="kiosk"
          onClick={onDone}
          variant="outline"
          className="px-16 border-2 hover:bg-card"
        >
          <Home className="mr-3 size-8" /> DONE
        </Button>
      </div>
    </div>
  );
}
