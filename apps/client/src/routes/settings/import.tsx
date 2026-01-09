import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SidebarProvider, SidebarInset } from "@bookie/ui/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@bookie/ui/components/ui/button";
import { Input } from "@bookie/ui/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bookie/ui/components/ui/tabs";
import {
  IconUpload,
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconFileSpreadsheet,
  IconDownload,
  IconX,
  IconBook,
  IconUsers,
  IconDatabaseImport,
} from "@tabler/icons-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/import")({
  component: UnifiedImportPage,
});

// --- Interfaces ---

interface ParsedBook {
  accessionNumber: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  condition: "new" | "good" | "fair" | "poor" | "damaged";
  replacementCost: number;
  location: string;
  pages?: number;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

interface ParsedStudent {
  studentId: string;
  name: string;
  gradeLevel: number;
  section?: string;
  email?: string;
  phone?: string;
  guardian?: string;
  guardianPhone?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

// --- Page Component ---

function UnifiedImportPage() {
  return (
    <AuthGuard requiredRoles={["admin", "staff"]}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <IconDatabaseImport className="h-8 w-8 text-primary" />
                  Data Import
                </h1>
                <p className="text-muted-foreground">Bulk import resources and users into the system</p>
              </div>
            </div>

            <Tabs defaultValue="books" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="books" className="flex items-center gap-2">
                  <IconBook className="size-4" />
                  Books
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <IconUsers className="size-4" />
                  Students
                </TabsTrigger>
              </TabsList>

              <TabsContent value="books">
                <BookImportTab />
              </TabsContent>

              <TabsContent value="students">
                <StudentImportTab />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

// --- Helpers ---

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

// --- Book Import Tab ---

function BookImportTab() {
  const [parsedItems, setParsedItems] = useState<ParsedBook[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const bulkCreate = useMutation(api.books.bulkCreate);
  const checkDuplicates = useQuery(
    api.books.checkDuplicates,
    parsedItems.length > 0
      ? { accessionNumbers: parsedItems.map((b) => b.accessionNumber) }
      : "skip"
  );

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        toast.error("CSV must contain at least a header and one row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const items: ParsedBook[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const errors: string[] = [];
        const getValue = (key: string) => {
          const index = headers.indexOf(key);
          return index >= 0 ? values[index]?.trim() : undefined;
        };

        const accessionNumber = getValue("accessionnumber") || getValue("accession") || "";
        const title = getValue("title") || "";
        const author = getValue("author") || "";
        if (!accessionNumber) errors.push("Missing accession number");
        if (!title) errors.push("Missing title");
        if (!author) errors.push("Missing author");

        items.push({
          accessionNumber,
          title,
          author,
          isbn: getValue("isbn"),
          category: getValue("category") || "general",
          location: getValue("location") || "General",
          condition: (getValue("condition") as any) || "good",
          replacementCost: parseFloat(getValue("cost") || getValue("replacementcost") || "500"),
          pages: getValue("pages") ? parseInt(getValue("pages") || "0", 10) : undefined,
          isValid: errors.length === 0,
          errors,
        });
      }

      setParsedItems(items);
      setImportResult(null);
      toast.success(`Parsed ${items.length} books from CSV`);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    const valid = parsedItems.filter((b) => b.isValid && !b.isDuplicate);
    if (valid.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    try {
      const batchSize = 50;
      let created = 0, skipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < valid.length; i += batchSize) {
        const batch = valid.slice(i, i + batchSize);
        const res = await bulkCreate({ books: batch as any });
        created += res.created;
        skipped += res.skipped;
        allErrors.push(...res.errors);
        setImportProgress(((i + batch.length) / valid.length) * 100);
      }
      setImportResult({ created, skipped, errors: allErrors });
      toast.success(`Imported ${created} books!`);
    } catch (e: any) {
      toast.error("Import failed", { description: e.message });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `AccessionNumber,Title,Author,ISBN,Category,Publisher,Year,Condition,Cost,Location,Pages
B-2026-0001,Sample Book Title,Author Name,9781234567890,fiction,Publisher Inc,2024,good,500,Shelf A-1,320`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "book_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemsWithDuplicates = parsedItems.map((item) => ({
    ...item,
    isDuplicate: checkDuplicates?.includes(item.accessionNumber),
  }));

  const stats = {
    valid: itemsWithDuplicates.filter(i => i.isValid && !i.isDuplicate).length,
    invalid: itemsWithDuplicates.filter(i => !i.isValid).length,
    duplicate: itemsWithDuplicates.filter(i => i.isDuplicate).length,
  };

  return (
    <div className="space-y-6">
      <ImportControls
        title="Import Books"
        description="Upload book catalog CSV"
        onUpload={handleFileUpload}
        onDownloadTemplate={downloadTemplate}
        parsedCount={parsedItems.length}
        onClear={() => setParsedItems([])}
      />

      {parsedItems.length > 0 && (
        <>
          <StatsHeader stats={stats} total={parsedItems.length} />
          {isImporting && <ProgressCard progress={importProgress} />}
          {importResult && <ResultCard result={importResult} label="books" />}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Review items before final import.</CardDescription>
              </div>
              <Button onClick={handleImport} disabled={isImporting || stats.valid === 0}>
                {isImporting ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconUpload className="mr-2 h-4 w-4" />}
                Import {stats.valid} Books
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Accession</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsWithDuplicates.slice(0, 50).map((b, idx) => (
                    <TableRow key={idx} className={!b.isValid ? "bg-red-50" : b.isDuplicate ? "bg-amber-50" : ""}>
                      <TableCell><StatusBadge isValid={b.isValid} isDuplicate={b.isDuplicate} /></TableCell>
                      <TableCell className="font-mono text-xs">{b.accessionNumber}</TableCell>
                      <TableCell className="font-medium text-sm">{b.title}</TableCell>
                      <TableCell className="text-sm">{b.author}</TableCell>
                      <TableCell className="text-sm">{b.category}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// --- Student Import Tab ---

function StudentImportTab() {
  const [parsedItems, setParsedItems] = useState<ParsedStudent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const bulkCreate = useMutation(api.students.bulkCreate);
  const checkDuplicates = useQuery(
    api.students.checkDuplicates,
    parsedItems.length > 0
      ? { studentIds: parsedItems.map((s) => s.studentId) }
      : "skip"
  );

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const items: ParsedStudent[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const errors: string[] = [];
        const getValue = (key: string) => {
          const index = headers.indexOf(key);
          return index >= 0 ? values[index]?.trim() : undefined;
        };

        const studentId = getValue("studentid") || getValue("id") || "";
        const name = getValue("name") || "";
        const gradeLevel = parseInt(getValue("gradelevel") || getValue("grade") || "0", 10);

        if (!studentId) errors.push("Missing Student ID");
        if (!name) errors.push("Missing Name");
        if (isNaN(gradeLevel) || gradeLevel < 1) errors.push("Invalid Grade Level");

        items.push({
          studentId,
          name,
          gradeLevel,
          section: getValue("section"),
          email: getValue("email"),
          phone: getValue("phone"),
          guardian: getValue("guardian"),
          guardianPhone: getValue("guardianphone"),
          isValid: errors.length === 0,
          errors,
        });
      }

      setParsedItems(items);
      setImportResult(null);
      toast.success(`Parsed ${items.length} students from CSV`);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    const valid = parsedItems.filter((s) => s.isValid && !s.isDuplicate);
    if (valid.length === 0) return;

    setIsImporting(true);
    try {
      const batchSize = 50;
      let created = 0, skipped = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < valid.length; i += batchSize) {
        const batch = valid.slice(i, i + batchSize);
        const res = await bulkCreate({ students: batch as any });
        created += res.created;
        skipped += res.skipped;
        allErrors.push(...res.errors);
        setImportProgress(((i + batch.length) / valid.length) * 100);
      }
      setImportResult({ created, skipped, errors: allErrors });
      toast.success(`Imported ${created} students!`);
    } catch (e: any) {
      toast.error("Import failed", { description: e.message });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `StudentId,Name,GradeLevel,Section,Email,Phone,Guardian,GuardianPhone
2024-0001,John Doe,7,Emerald,john@example.com,09123456789,Jane Doe,09987654321`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemsWithDuplicates = parsedItems.map((item) => ({
    ...item,
    isDuplicate: checkDuplicates?.includes(item.studentId),
  }));

  const stats = {
    valid: itemsWithDuplicates.filter(i => i.isValid && !i.isDuplicate).length,
    invalid: itemsWithDuplicates.filter(i => !i.isValid).length,
    duplicate: itemsWithDuplicates.filter(i => i.isDuplicate).length,
  };

  return (
    <div className="space-y-6">
      <ImportControls
        title="Import Students"
        description="Upload student roster CSV"
        onUpload={handleFileUpload}
        onDownloadTemplate={downloadTemplate}
        parsedCount={parsedItems.length}
        onClear={() => setParsedItems([])}
      />

      {parsedItems.length > 0 && (
        <>
          <StatsHeader stats={stats} total={parsedItems.length} />
          {isImporting && <ProgressCard progress={importProgress} />}
          {importResult && <ResultCard result={importResult} label="students" />}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Review roster before final import.</CardDescription>
              </div>
              <Button onClick={handleImport} disabled={isImporting || stats.valid === 0}>
                {isImporting ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconUpload className="mr-2 h-4 w-4" />}
                Import {stats.valid} Students
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsWithDuplicates.slice(0, 50).map((s, idx) => (
                    <TableRow key={idx} className={!s.isValid ? "bg-red-50" : s.isDuplicate ? "bg-amber-50" : ""}>
                      <TableCell><StatusBadge isValid={s.isValid} isDuplicate={s.isDuplicate} /></TableCell>
                      <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm">Grade {s.gradeLevel}</TableCell>
                      <TableCell className="text-sm">{s.section || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// --- UI Components ---

function ImportControls({ title, description, onUpload, onDownloadTemplate, parsedCount, onClear }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconFileSpreadsheet className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
          <IconDownload className="mr-2 h-4 w-4" />
          Template
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Input type="file" accept=".csv" onChange={onUpload} className="max-w-md" />
          {parsedCount > 0 && (
            <Button variant="ghost" onClick={onClear}>
              <IconX className="mr-2 h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsHeader({ stats, total }: any) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard label="Total Rows" value={total} />
      <StatCard label="Ready" value={stats.valid} color="text-green-600" />
      <StatCard label="Duplicates" value={stats.duplicate} color="text-amber-600" />
      <StatCard label="Invalid" value={stats.invalid} color="text-red-600" />
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ProgressCard({ progress }: any) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Importing...</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{progress.toFixed(0)}% complete</p>
      </CardContent>
    </Card>
  );
}

function ResultCard({ result, label }: any) {
  return (
    <Card className={result.created > 0 ? "border-green-500" : "border-amber-500"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {result.created > 0 ? <IconCheck className="h-5 w-5 text-green-600" /> : <IconAlertTriangle className="h-5 w-5 text-amber-600" />}
          Import Complete
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium text-green-600">{result.created} {label} created</p>
        {result.skipped > 0 && <p className="text-sm text-amber-600">{result.skipped} duplicates skipped</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ isValid, isDuplicate }: any) {
  if (!isValid) return <Badge variant="destructive">Invalid</Badge>;
  if (isDuplicate) return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Duplicate</Badge>;
  return <Badge className="bg-green-600">Ready</Badge>;
}
