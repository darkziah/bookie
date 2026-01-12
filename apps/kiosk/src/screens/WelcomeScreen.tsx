import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="text-center py-8">
      <div className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 md:mb-10 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-ring relative">
        <Book className="size-16 md:size-24 text-primary relative z-10" />
      </div>
      <h2 className="text-4xl md:text-6xl font-black text-foreground mb-3 md:mb-4 tracking-tight">Ready to Read?</h2>
      <p className="text-lg md:text-2xl text-muted-foreground mb-8 md:mb-12">Tap the button below to start your session</p>
      <Button
        size="kiosk"
        onClick={onStart}
        className="px-12 md:px-20 h-16 md:h-24 text-xl md:text-3xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        START SESSION
      </Button>
    </div>
  );
}
