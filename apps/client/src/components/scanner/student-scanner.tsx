import { BarcodeScanner } from "./barcode-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bookie/ui/components/ui/card";
import { IconUser } from "@tabler/icons-react";

interface StudentScannerProps {
  onScan: (studentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function StudentScanner({ onScan, onError, className }: StudentScannerProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconUser className="h-5 w-5" />
          Student ID
        </CardTitle>
        <CardDescription>
          Scan student ID card or enter manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BarcodeScanner
          onScan={onScan}
          onError={onError}
          placeholder="Enter Student ID (e.g., 2024-0001)"
          scanButtonLabel="Scan Student ID"
        />
      </CardContent>
    </Card>
  );
}
