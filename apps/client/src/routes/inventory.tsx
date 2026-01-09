import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@bookie/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookie/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookie/ui/components/ui/table";
import { Badge } from "@bookie/ui/components/ui/badge";
import { Progress } from "@bookie/ui/components/ui/progress";
import {
  IconScan,
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconPackage,
  IconClipboardList,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <AppLayout title="Inventory">
      <InventoryContent />
    </AppLayout>
  );
}

function InventoryContent() {
  const [isScanMode, setIsScanMode] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scannedBooks, setScannedBooks] = useState<Set<string>>(new Set());
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const locations = useQuery(api.books.getLocations, {});
  const categories = useQuery(api.books.getCategories, {});
  const inventoryStatus = useQuery(api.books.getInventoryStatus, {
    location: locationFilter !== "all" ? locationFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const markInventoried = useMutation(api.books.markInventoried);
  const getByAccession = useQuery(
    api.books.getByAccession,
    lastScanned ? { accessionNumber: lastScanned } : "skip"
  );

  const handleScan = useCallback(
    async (accessionNumber: string) => {
      setLastScanned(accessionNumber);

      // Small delay to let query update
      setTimeout(async () => {
        try {
          if (scannedBooks.has(accessionNumber)) {
            toast.info("Already scanned", { description: accessionNumber });
            return;
          }

          // We'll mark it inventoried using the mutation with the book we find
          const bookData = getByAccession;
          if (bookData) {
            await markInventoried({ id: bookData._id });
            setScannedBooks((prev) => new Set([...prev, accessionNumber]));
            toast.success("Book inventoried!", {
              description: `${bookData.title}`,
            });
          } else {
            toast.error("Book not found", { description: accessionNumber });
          }
        } catch (error: any) {
          toast.error("Scan failed", { description: error.message });
        }
      }, 200);
    },
    [getByAccession, markInventoried, scannedBooks]
  );

  const progress = inventoryStatus
    ? (inventoryStatus.inventoried / Math.max(inventoryStatus.total, 1)) * 100
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground">Track and verify book inventory</p>
        </div>
        <Button
          variant={isScanMode ? "default" : "outline"}
          onClick={() => setIsScanMode(!isScanMode)}
          className="w-full sm:w-auto"
        >
          <IconScan className="mr-2 h-4 w-4" />
          {isScanMode ? "Stop Scanning" : "Start Scan Mode"}
        </Button>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconPackage className="h-3 w-3" />
            Total Books
          </span>
          <div className="text-xl sm:text-2xl font-bold">
            {inventoryStatus?.total ?? (
              <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconCheck className="h-3 w-3 text-green-600" />
            Checked
          </span>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {inventoryStatus?.inventoried ?? "0"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconClipboardList className="h-3 w-3 text-amber-600" />
            Not Checked
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            {inventoryStatus?.notInventoried ?? "0"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconAlertTriangle className="h-3 w-3 text-red-600" />
            Missing
          </span>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {inventoryStatus?.potentiallyMissing ?? "0"}
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm font-semibold">Inventory Progress</CardTitle>
          <CardDescription className="text-xs">
            {inventoryStatus?.inventoried ?? 0} of {inventoryStatus?.total ?? 0}{" "}
            books checked ({progress.toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters - Responsive layout */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations?.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setScannedBooks(new Set());
            setLastScanned(null);
            toast.info("Session reset");
          }}
          className="w-full sm:w-auto ml-0 sm:ml-auto"
        >
          <IconRefresh className="mr-2 h-4 w-4" />
          Reset Session
        </Button>
      </div>

      {/* Scanner Mode */}
      {isScanMode && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconScan className="h-4 w-4 text-primary" />
              Scan Mode Active
            </CardTitle>
            <CardDescription className="text-xs">
              Scan book barcodes to mark them as inventoried. Scanned this
              session: {scannedBooks.size}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <BarcodeScanner
              onScan={handleScan}
              placeholder="Scan/Enter accession #"
            />
            {lastScanned && getByAccession && (
              <div className="mt-4 p-3 bg-background rounded-lg border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-semibold line-clamp-1 text-primary">
                  {getByAccession.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {getByAccession.accessionNumber} • {getByAccession.location}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Missing Books Table - With overflow scroll */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-4 border-b">
          <CardTitle className="text-base">Books Not Yet Inventoried</CardTitle>
          <CardDescription className="text-xs">
            These books have not been scanned in the current inventory period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {inventoryStatus === undefined ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : inventoryStatus.missingBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <IconCheck className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">All books inventoried!</p>
                <p className="text-muted-foreground text-sm">
                  Great job! All filtered books have been checked.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Accession</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Author</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryStatus.missingBooks.map((book: any) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-mono text-xs sm:text-sm">
                        {book.accessionNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium line-clamp-2">{book.title}</div>
                        <div className="md:hidden text-[10px] text-muted-foreground">
                          {book.author}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {book.author}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">
                        {book.location}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 text-[10px] py-0 border-amber-200"
                        >
                          Pending
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

