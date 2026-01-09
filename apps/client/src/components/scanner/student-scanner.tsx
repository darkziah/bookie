import { Html5QrcodeSupportedFormats } from "html5-qrcode";
import { BarcodeScanner } from "./barcode-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bookie/ui/components/ui/card";
import { IconUser } from "@tabler/icons-react";

interface StudentScannerProps {
  onScan: (studentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

const STUDENT_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.ITF,
];

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
          supportedFormats={STUDENT_FORMATS}
          scanButtonLabel="Scan Student ID"
        />
      </CardContent>
    </Card>
  );
}
