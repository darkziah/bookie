import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Home } from "lucide-react";

interface SuccessScreenProps {
  onDone: () => void;
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="text-center py-6 md:py-12">
      <div className="relative mb-8 md:mb-12">
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <CheckCircle2 className="size-32 md:size-56 text-green-500 mx-auto relative drop-shadow-2xl" />
      </div>
      <h2 className="text-4xl md:text-7xl font-black text-foreground mb-3 md:mb-4 tracking-tighter">Enjoy your book!</h2>
      <p className="text-xl md:text-3xl text-muted-foreground mb-10 md:mb-16 max-w-2xl mx-auto px-4">Borrowing was successful. Remember to return it on time!</p>

      <div className="space-y-4 md:space-y-6">
        <p className="text-muted-foreground font-medium flex items-center justify-center gap-2 text-sm md:text-base">
          <Loader2 className="size-4 animate-spin" />
          Next student can start in a few seconds...
        </p>
        <Button
          size="kiosk"
          onClick={onDone}
          variant="outline"
          className="px-10 md:px-16 h-14 md:h-auto border-2 hover:bg-card text-lg md:text-xl"
        >
          <Home className="mr-2 md:mr-3 size-6 md:size-8" /> DONE
        </Button>
      </div>
    </div>
  );
}
