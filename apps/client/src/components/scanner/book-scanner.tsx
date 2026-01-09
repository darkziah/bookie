import { Html5QrcodeSupportedFormats } from "html5-qrcode";
import { BarcodeScanner } from "./barcode-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bookie/ui/components/ui/card";
import { IconBook } from "@tabler/icons-react";

interface BookScannerProps {
  onScan: (accessionNumber: string) => void;
  onError?: (error: string) => void;
  className?: string;
  mode?: "accession" | "isbn";
}

const BOOK_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13, // ISBN barcodes
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.UPC_A,
];

export function BookScanner({
  onScan,
  onError,
  className,
  mode = "accession"
}: BookScannerProps) {
  const isIsbnMode = mode === "isbn";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconBook className="h-5 w-5" />
          {isIsbnMode ? "ISBN Lookup" : "Book Accession"}
        </CardTitle>
        <CardDescription>
          {isIsbnMode
            ? "Scan ISBN barcode to look up book details"
            : "Scan book barcode or enter accession number"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BarcodeScanner
          onScan={onScan}
          onError={onError}
          placeholder={isIsbnMode ? "Enter ISBN (e.g., 9781234567890)" : "Enter Accession No. (e.g., B-2024-0001)"}
          supportedFormats={BOOK_FORMATS}
          scanButtonLabel={isIsbnMode ? "Scan ISBN" : "Scan Book"}
        />
      </CardContent>
    </Card>
  );
}
