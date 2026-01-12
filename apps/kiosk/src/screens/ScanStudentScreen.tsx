import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ArrowRight } from "lucide-react";

interface ScanStudentScreenProps {
  onScan: (id: string) => void;
  onCancel: () => void;
}

export function ScanStudentScreen({ onScan, onCancel }: ScanStudentScreenProps) {
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
