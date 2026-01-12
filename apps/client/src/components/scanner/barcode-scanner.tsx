import { useState, useRef, useCallback, useEffect } from "react";
import { BarcodeScanner as ReactBarcodeScanner } from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";
import { Button } from "@bookie/ui/components/ui/button";
import {
  IconCamera,
  IconCameraOff,
  IconKeyboard,
  IconX,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { cn } from "@bookie/ui/lib/utils";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
  scanButtonLabel?: string;
  showManualEntry?: boolean;
  /** Enable fullscreen mode on mobile devices when scanning (default: true) */
  fullscreenOnMobile?: boolean;
}

type CameraFacing = "environment" | "user";

export function BarcodeScanner({
  onScan,
  onError,
  placeholder = "Scan or enter code...",
  className,
  scanButtonLabel = "Scan",
  showManualEntry = true,
  fullscreenOnMobile = true,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when fullscreen scanning on mobile
  useEffect(() => {
    if (isScanning && isMobile && fullscreenOnMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isScanning, isMobile, fullscreenOnMobile]);

  // Reset last scanned after delay
  useEffect(() => {
    if (lastScanned) {
      const timer = setTimeout(() => setLastScanned(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastScanned]);

  const startScanning = useCallback(async () => {
    setErrorMessage(null);

    // Check for camera permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setIsScanning(true);
    } catch (error: any) {
      console.error("Camera permission error:", error);
      setHasPermission(false);

      let message = "Failed to access camera";
      if (error.name === "NotAllowedError") {
        message = "Camera access denied. Please enable camera permissions.";
      } else if (error.name === "NotFoundError") {
        message = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      }

      setErrorMessage(message);
      onError?.(message);
    }
  }, [onError]);

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
        setLastScanned(code);

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

  const handleError = useCallback(
    (error: Error) => {
      console.error("Scanner error:", error);
      const message = error.message || "Scanner error occurred";
      setErrorMessage(message);
      onError?.(message);
    },
    [onError]
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

  // Determine if we should use fullscreen mode
  const useFullscreen = isScanning && isMobile && fullscreenOnMobile;

  // Scanner content with overlay
  const scannerContent = (
    <div className={cn("relative w-full", useFullscreen ? "h-full" : "aspect-video")}>
      <ReactBarcodeScanner
        options={{
          delay: 500,
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
        <div className="absolute inset-0 bg-black/40" />

        {/* Clear scan area */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            useFullscreen
              ? "w-[85%] max-w-[350px] h-[150px]"
              : "w-[80%] max-w-[320px] h-[100px]"
          )}
          style={{
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
          }}
        >
          {/* Corner brackets */}
          <div className="absolute inset-0 border-2 border-primary/50 rounded-sm" />
          <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-primary rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-primary rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-primary rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-primary rounded-br-sm" />

          {/* Laser Line Animation */}
          <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute top-0 animate-scanner-laser" />
        </div>
      </div>

      {/* Top controls for fullscreen */}
      {useFullscreen && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pt-safe flex justify-between items-start z-10">
          <button
            onClick={stopScanning}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Close scanner"
          >
            <IconX className="h-6 w-6" />
          </button>

          <button
            onClick={switchCamera}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Switch camera"
          >
            <IconSwitchHorizontal className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent",
          useFullscreen ? "p-6 pb-safe" : "p-4"
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-white font-medium flex items-center gap-2",
              useFullscreen ? "text-base" : "text-sm"
            )}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Align barcode within frame
          </span>
          {!useFullscreen && (
            <Button variant="destructive" size="sm" onClick={stopScanning}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Scanner Container */}
        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden bg-muted/50 transition-all"
        >
          {/* Inline scanner (for desktop or when not using fullscreen) */}
          {isScanning && !useFullscreen && (
            <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg">
              {scannerContent}
            </div>
          )}

          {!isScanning && (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 p-4">
              {errorMessage ? (
                <>
                  <IconCameraOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    {errorMessage}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={startScanning}>
                    Try Again
                  </Button>
                </>
              ) : hasPermission === false ? (
                <>
                  <IconCameraOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Camera access denied. Please enable camera permissions.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={startScanning}>
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <IconCamera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to start scanning
                  </p>
                  <Button onClick={startScanning} type="button">
                    <IconCamera className="mr-2 h-4 w-4" />
                    {scanButtonLabel}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Manual Entry */}
        {showManualEntry && (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <IconKeyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={!manualEntry.trim()}
            >
              Enter
            </Button>
          </form>
        )}

        {/* Scanner CSS */}
        <style>{`
          .scanner-success {
            animation: scanner-flash 0.3s ease-out;
          }
          @keyframes scanner-flash {
            0% { box-shadow: inset 0 0 0 4px rgb(34 197 94); }
            100% { box-shadow: inset 0 0 0 0 rgb(34 197 94); }
          }
          @keyframes scanner-laser {
            0% { top: 0%; }
            50% { top: calc(100% - 2px); }
            100% { top: 0%; }
          }
          .animate-scanner-laser {
            animation: scanner-laser 2s ease-in-out infinite;
          }
          /* Safe area support for notched devices */
          .pb-safe {
            padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
          }
          .pt-safe {
            padding-top: max(1rem, env(safe-area-inset-top));
          }
        `}</style>
      </div>

      {/* Fullscreen Scanner Overlay (for mobile) */}
      {useFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">{scannerContent}</div>
      )}
    </>
  );
}
