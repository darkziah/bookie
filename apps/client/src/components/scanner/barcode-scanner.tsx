import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@bookie/ui/components/ui/button";
import {
  IconCamera,
  IconCameraOff,
  IconRefresh,
  IconKeyboard,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@bookie/ui/lib/utils";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  supportedFormats?: Html5QrcodeSupportedFormats[];
  className?: string;
  scanButtonLabel?: string;
  showManualEntry?: boolean;
  /** Enable fullscreen mode on mobile devices when scanning (default: true) */
  fullscreenOnMobile?: boolean;
}

const DEFAULT_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
];

export function BarcodeScanner({
  onScan,
  onError,
  placeholder = "Scan or enter code...",
  supportedFormats = DEFAULT_FORMATS,
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const scannerIdRef = useRef(`scanner-${Math.random().toString(36).substr(2, 9)}`);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.warn("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Check if already scanning
      if (scannerRef.current?.isScanning) {
        await stopScanning();
      }

      // Create new scanner instance
      scannerRef.current = new Html5Qrcode(scannerIdRef.current, {
        formatsToSupport: supportedFormats,
        verbose: false,
      });

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Optimal for linear barcodes: wider and shorter
            const width = Math.min(viewfinderWidth * 0.8, 500);
            const height = Math.min(viewfinderHeight * 0.3, 200);
            return { width, height };
          },
          aspectRatio: 1.777778,
          disableFlip: true,
        },
        (decodedText) => {
          // Prevent duplicate scans
          if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            onScan(decodedText);

            // Visual feedback - flash effect
            if (containerRef.current) {
              containerRef.current.classList.add("scanner-success");
              setTimeout(() => {
                containerRef.current?.classList.remove("scanner-success");
              }, 300);
            }

            // Auto-stop after successful scan
            stopScanning();
          }
        },
        () => {
          // Scanning in progress, ignore errors
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (error: any) {
      console.error("Scanner error:", error);
      setHasPermission(false);
      onError?.(error.message || "Failed to start scanner");
    }
  }, [supportedFormats, onScan, onError, lastScanned, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScan(manualEntry.trim());
      setManualEntry("");
    }
  };

  // Determine if we should use fullscreen mode
  const useFullscreen = isScanning && isMobile && fullscreenOnMobile;

  // Scanner overlay content (shared between inline and fullscreen modes)
  const scannerOverlay = (
    <>
      <div className="absolute inset-0 pointer-events-none border-2 border-primary/30" />

      {/* Laser Line Animation */}
      <div className={cn(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none",
        useFullscreen ? "w-[90%] h-[40%] max-w-none max-h-none" : "w-[80%] max-w-[500px] h-[30%] max-h-[200px]"
      )}>
        <div className="absolute inset-0 border-2 border-primary/50 rounded-sm" />
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
        <div className="w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute top-0 animate-scanner-laser" />
      </div>

      {/* Bottom controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent",
        useFullscreen ? "p-6 pb-safe" : "p-4"
      )}>
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-white font-medium flex items-center gap-2",
            useFullscreen ? "text-base" : "text-sm"
          )}>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Align barcode within frame
          </span>
          <Button
            variant="destructive"
            size={useFullscreen ? "default" : "sm"}
            onClick={stopScanning}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Close button for fullscreen mode */}
      {useFullscreen && (
        <button
          onClick={stopScanning}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 mt-safe"
          aria-label="Close scanner"
        >
          <IconX className="h-6 w-6" />
        </button>
      )}
    </>
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
          {!useFullscreen && (
            <div
              id={scannerIdRef.current}
              className={cn(
                "w-full aspect-video",
                !isScanning && "hidden"
              )}
            />
          )}

          {!isScanning && (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 p-4">
              {hasPermission === false ? (
                <>
                  <IconCameraOff className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Camera access denied. Please enable camera permissions.
                  </p>
                  <Button variant="outline" size="sm" onClick={startScanning}>
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <IconCamera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to start scanning
                  </p>
                  <Button onClick={startScanning}>
                    <IconCamera className="mr-2 h-4 w-4" />
                    {scanButtonLabel}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Inline scanning indicator & Overlay (for desktop) */}
          {isScanning && !useFullscreen && (
            <>{scannerOverlay}</>
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
            <Button type="submit" variant="secondary" disabled={!manualEntry.trim()}>
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
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-scanner-laser {
            animation: scanner-laser 2s linear infinite;
          }
          #${scannerIdRef.current} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
          #${scannerIdRef.current} {
            background: #000;
          }
          /* Safe area support for notched devices */
          .pb-safe {
            padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
          }
          .mt-safe {
            margin-top: max(1rem, env(safe-area-inset-top));
          }
        `}</style>
      </div>

      {/* Fullscreen Scanner Overlay (for mobile) */}
      {useFullscreen && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-50 bg-black"
        >
          <div
            id={scannerIdRef.current}
            className="w-full h-full"
          />
          {scannerOverlay}
        </div>
      )}
    </>
  );
}
