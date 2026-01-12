import { useState, useRef, useCallback, useEffect } from "react";
import { BarcodeScanner as ReactBarcodeScanner } from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";
import { Button } from "@/components/ui/button";
import { ScanLine, X, RefreshCw, Keyboard, Camera, CameraOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KioskScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
  isVerifying?: boolean;
}

type CameraFacing = "environment" | "user";

export function KioskScanner({
  onScan,
  onError,
  placeholder = "Enter code manually...",
  title = "Scan Barcode",
  description = "Position the barcode within the frame",
  className,
  isVerifying = false,
}: KioskScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    setErrorMessage(null);

    try {
      // Request camera access to trigger the permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch (error: any) {
      console.error("Camera permission check failed:", error);

      let message = "Failed to access camera";
      if (error.name === "NotAllowedError") {
        message = "Camera access denied. Please enable camera permissions.";
      } else if (error.name === "NotFoundError") {
        message = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      }

      setHasPermission(false);
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const startScanning = useCallback(() => {
    setErrorMessage(null);
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleCapture = useCallback(
    (detectedCodes: { rawValue: string }[]) => {
      const firstCode = detectedCodes[0];
      if (firstCode) {
        const code = firstCode.rawValue;
        const now = Date.now();

        // Prevent duplicate scans within 2 seconds
        if (
          lastScanRef.current &&
          lastScanRef.current.code === code &&
          now - lastScanRef.current.time < 2000
        ) {
          return;
        }

        lastScanRef.current = { code, time: now };

        // Visual feedback - flash effect
        if (containerRef.current) {
          containerRef.current.classList.add("scanner-success");
          setTimeout(() => {
            containerRef.current?.classList.remove("scanner-success");
          }, 300);
        }

        onScan(code);
        stopScanning();
      }
    },
    [onScan, stopScanning]
  );

  const switchCamera = useCallback(() => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScan(manualEntry.trim());
      setManualEntry("");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Scanner Area */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-black border-2 border-border transition-all"
      >
        {/* Permission checking */}
        {hasPermission === null && (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-6 p-8 bg-muted/50">
            <div className="p-6 rounded-full bg-primary/10 animate-pulse">
              <Loader2 className="size-16 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">Checking Camera...</h3>
              <p className="text-muted-foreground">Please allow camera access when prompted</p>
            </div>
          </div>
        )}

        {/* Permission denied */}
        {hasPermission === false && (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-6 p-8 bg-muted/50">
            <div className="p-6 rounded-full bg-destructive/10">
              <CameraOff className="size-16 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">Camera Unavailable</h3>
              <p className="text-muted-foreground max-w-md">
                {errorMessage || "Camera access was denied. Please enable camera permissions."}
              </p>
            </div>
            <Button size="lg" onClick={checkCameraPermission} className="gap-2">
              <RefreshCw className="size-5" />
              Try Again
            </Button>
          </div>
        )}

        {/* Permission granted - ready to scan */}
        {hasPermission === true && !isScanning && (
          <div className="w-full aspect-video flex flex-col items-center justify-center gap-6 p-8 bg-muted/50">
            <div className="p-6 rounded-full bg-green-500/10">
              <Camera className="size-16 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground">Camera ready. Tap below to start scanning.</p>
            </div>
            <Button size="lg" onClick={startScanning} className="px-12 h-16 text-xl gap-3">
              <ScanLine className="size-6" />
              Start Scanning
            </Button>
          </div>
        )}

        {/* Active scanning */}
        {hasPermission === true && isScanning && (
          <div className="relative w-full aspect-video">
            <ReactBarcodeScanner
              options={{
                delay: 300,
                formats: [
                  "ean_13",
                  "ean_8",
                  "code_128",
                  "code_39",
                  "code_93",
                  "upc_a",
                  "upc_e",
                  "itf",
                  "qr_code",
                ],
              }}
              onCapture={handleCapture}
              trackConstraints={{
                facingMode: cameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              className="w-full h-full object-cover"
            />

            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Darkened edges */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Clear scan area */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] max-w-[320px] h-[130px]"
                style={{
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
              >
                {/* Corner brackets */}
                <div className="absolute inset-0 border-2 border-primary/50 rounded" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br" />

                {/* Scanning laser line */}
                <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* Control buttons overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
              <button
                onClick={stopScanning}
                className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur"
                aria-label="Close scanner"
              >
                <X className="size-6" />
              </button>
              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur"
                aria-label="Switch camera"
              >
                <RefreshCw className="size-6" />
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-center font-medium flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Verifying Overlay */}
        {hasPermission === true && isVerifying && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-16 text-primary animate-spin" />
            <p className="text-xl font-bold text-foreground">Verifying...</p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="space-y-3">
        <p className="text-center text-muted-foreground text-lg">
          Or enter the code manually:
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-14 pr-4 h-16 text-xl rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="h-16 px-8 text-xl"
            disabled={!manualEntry.trim()}
          >
            Enter
          </Button>
        </form>
      </div>

      {/* Scanner animation CSS */}
      <style>{`
        .scanner-success {
          animation: scanner-flash 0.3s ease-out;
        }
        @keyframes scanner-flash {
          0% { box-shadow: inset 0 0 0 4px rgb(34 197 94); }
          100% { box-shadow: inset 0 0 0 0 rgb(34 197 94); }
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
