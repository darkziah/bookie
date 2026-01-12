import { Button } from "@/components/ui/button";
import { Book, LogOut } from "lucide-react";

interface SessionControlsProps {
  student: {
    name: string;
    gradeLevel: number;
    activeLoanCount: number;
    borrowingLimit: number;
  };
  secondsRemaining: number;
  onLogout: () => void;
}

export function SessionControls({ student, secondsRemaining, onLogout }: SessionControlsProps) {
  return (
    <div className="flex items-center bg-card/80 backdrop-blur-md border shadow-lg rounded-full py-1.5 pl-6 pr-1.5 gap-6 animate-in fade-in slide-in-from-top-4">
      {/* User Info */}
      <div className="flex flex-col justify-center">
        <span className="font-bold text-sm text-foreground leading-none mb-1">
          {student.name}
        </span>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Grade {student.gradeLevel}
        </span>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border/60" />

      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none mb-0.5">Borrowed</span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className={`text-base font-bold ${student.activeLoanCount >= student.borrowingLimit ? "text-destructive" : "text-foreground"}`}>
              {student.activeLoanCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">/ {student.borrowingLimit}</span>
          </div>
        </div>
        <div className={`p-2 rounded-full border ${student.activeLoanCount >= student.borrowingLimit ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/10 border-primary/20 text-primary"}`}>
          <Book className="size-4" />
        </div>
      </div>

      {/* Timeout Warning */}
      <div className="flex flex-col items-end min-w-[60px]">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none mb-0.5">Timeout</span>
        <span className={`text-base font-bold font-mono ${secondsRemaining < 10 ? "text-destructive animate-pulse" : "text-foreground"}`}>
          {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
        </span>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border/60" />

      {/* Logout */}
      <Button
        variant="ghost"
        onClick={onLogout}
        className="h-11 rounded-full px-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
