import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "convex/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bookie/ui/components/ui/tabs";
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconChartBar,
  IconLoader2,
  IconBook,
  IconUsers,
  IconAlertTriangle,
  IconCurrency,
  IconDownload,
  IconTrendingUp,
  IconFileTypePdf,
} from "@tabler/icons-react";
import {
  generateCirculationPDF,
  generateOverduePDF,
  generateCollectionPDF,
} from "@/lib/export-utils";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppLayout title="Reports">
      <ReportsContent />
    </AppLayout>
  );
}

function ReportsContent() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dateRange, setDateRange] = useState(() => {
    const end = Date.now();
    const start = end - 90 * 24 * 60 * 60 * 1000; // Last 90 days
    return { start, end };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <p className="text-muted-foreground">Analytics and accountability reports</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <Tabs defaultValue="circulation" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto justify-start sm:grid sm:grid-cols-4 sm:max-w-xl h-auto p-1 bg-muted/50">
          <TabsTrigger value="circulation" className="flex-1 py-1.5 text-xs sm:text-sm">Circulation</TabsTrigger>
          <TabsTrigger value="collection" className="flex-1 py-1.5 text-xs sm:text-sm">Collection</TabsTrigger>
          <TabsTrigger value="overdue" className="flex-1 py-1.5 text-xs sm:text-sm">Overdue</TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 py-1.5 text-xs sm:text-sm">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="circulation">
          <CirculationReport period={period} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="collection">
          <CollectionReport />
        </TabsContent>

        <TabsContent value="overdue">
          <OverdueReport />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CirculationReport({ period, dateRange }: {
  period: "daily" | "weekly" | "monthly";
  dateRange: { start: number; end: number }
}) {
  const circulationData = useQuery(api.transactions.getCirculationByPeriod, {
    period,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const gradeData = useQuery(api.transactions.getCirculationByGrade, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const stats = useQuery(api.transactions.getStats, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconBook className="h-3 w-3" />
            Checkouts
          </span>
          <div className="text-xl sm:text-2xl font-bold">
            {stats?.totalCheckouts ?? <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconTrendingUp className="h-3 w-3 text-green-600" />
            Returns
          </span>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {stats?.totalCheckins ?? "0"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconUsers className="h-3 w-3 text-amber-600" />
            Active Loans
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            {stats?.currentActiveLoans ?? "0"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconAlertTriangle className="h-3 w-3 text-red-600" />
            Overdue
          </span>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {stats?.currentOverdue ?? "0"}
          </div>
        </Card>
      </div>

      {/* Period Breakdown */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 border-b">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconChartBar className="h-4 w-4 text-primary" />
              Circulation by {period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month"}
            </CardTitle>
            <CardDescription className="text-xs">Activity over time</CardDescription>
          </div>
          {circulationData && circulationData.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => generateCirculationPDF(period, circulationData)} className="w-full sm:w-auto">
              <IconFileTypePdf className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {circulationData === undefined ? (
              <div className="flex justify-center py-8">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : circulationData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No data for this period</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Checkouts</TableHead>
                    <TableHead className="text-right">Returns</TableHead>
                    <TableHead className="text-right">Renewals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circulationData.slice(-12).map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="font-medium text-xs sm:text-sm">{row.period}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{row.checkouts}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-green-600">{row.returns}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-blue-600">{row.renewals}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Breakdown - Grid layout */}
      <Card>
        <CardHeader className="px-4 py-4 border-b">
          <CardTitle className="text-base">Circulation by Grade Level</CardTitle>
          <CardDescription className="text-xs">Activity breakdown by student grade</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {gradeData === undefined ? (
            <div className="flex justify-center py-8">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : gradeData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No data for this period</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {gradeData.map((row) => (
                <Card key={row.grade} className="bg-muted/30 p-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Grade {row.grade}</div>
                  <div className="text-xl font-bold mt-1">{row.checkouts}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {row.uniqueStudents} students
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CollectionReport() {
  const popularBooks = useQuery(api.books.getMostPopular, { limit: 10 });
  const weedingCandidates = useQuery(api.books.getWeedingCandidates, { daysSinceLastBorrow: 365 });
  const stats = useQuery(api.books.getStats, {});

  return (
    <div className="space-y-6">
      {/* Stats - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Books</span>
          <div className="text-xl sm:text-2xl font-bold">{stats?.total ?? "-"}</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</span>
          <div className="text-xl sm:text-2xl font-bold">₱{stats?.totalValue?.toLocaleString() ?? "0"}</div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 col-span-2 lg:col-span-1 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <span className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Weeding Candidates</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            {weedingCandidates?.length ?? "-"}
          </div>
        </Card>
      </div>

      {/* Most Popular */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 border-b">
          <div className="space-y-1">
            <CardTitle className="text-base">Most Popular Books</CardTitle>
            <CardDescription className="text-xs">Top 10 most borrowed books</CardDescription>
          </div>
          {popularBooks && popularBooks.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => generateCollectionPDF(popularBooks)} className="w-full sm:w-auto">
              <IconFileTypePdf className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {popularBooks === undefined ? (
              <div className="flex justify-center py-8">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Author</TableHead>
                    <TableHead className="text-right">Borrows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularBooks.map((book: any, index: number) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-bold text-muted-foreground text-xs sm:text-sm">#{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-xs sm:text-sm line-clamp-1">{book.title}</div>
                        <div className="sm:hidden text-[10px] text-muted-foreground">{book.author}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{book.author}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-[10px] py-0">{book.totalBorrows}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weeding Candidates */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-4 border-b">
          <CardTitle className="text-base">Weeding Candidates</CardTitle>
          <CardDescription className="text-xs">Books not borrowed in the past year</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {weedingCandidates === undefined ? (
              <div className="flex justify-center py-8">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : weedingCandidates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No weeding candidates found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Accession</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Last Borrowed</TableHead>
                    <TableHead className="text-right">Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weedingCandidates.slice(0, 20).map((book: any) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-mono text-[10px] sm:text-xs">{book.accessionNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-xs sm:text-sm line-clamp-1">{book.title}</div>
                        <div className="sm:hidden text-[10px] text-muted-foreground">
                          {book.lastBorrowedAt ? new Date(book.lastBorrowedAt).toLocaleDateString() : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {book.lastBorrowedAt
                          ? new Date(book.lastBorrowedAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-[10px] py-0">{book.condition}</Badge>
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

function OverdueReport() {
  const overdueData = useQuery(api.transactions.getOverdueReport, {});

  const handleExportCSV = () => {
    if (!overdueData) return;

    const headers = ["Student Name", "Student ID", "Grade", "Phone", "Book Title", "Accession", "Due Date", "Days Overdue", "Replacement Cost"];
    const rows = overdueData.map((row) => [
      row.studentName,
      row.studentId,
      row.gradeLevel,
      row.phone || "",
      row.bookTitle,
      row.accessionNumber,
      new Date(row.dueDate).toLocaleDateString(),
      row.daysOverdue,
      row.replacementCost,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overdue_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 border-b">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconAlertTriangle className="h-4 w-4 text-red-600" />
              Overdue Books
            </CardTitle>
            <CardDescription className="text-xs">
              {overdueData?.length ?? 0} overdue item(s)
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => {
              if (overdueData) generateOverduePDF(overdueData);
            }} disabled={!overdueData?.length} className="w-full sm:w-auto">
              <IconFileTypePdf className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!overdueData?.length} className="w-full sm:w-auto">
              <IconDownload className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {overdueData === undefined ? (
              <div className="flex justify-center py-8">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : overdueData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No overdue books! 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Grade</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueData.map((row) => (
                    <TableRow key={row.transactionId}>
                      <TableCell>
                        <div className="font-medium text-xs sm:text-sm">{row.studentName}</div>
                        <div className="text-[10px] text-muted-foreground sm:hidden">G{row.gradeLevel} • {row.phone}</div>
                        <div className="text-[10px] text-muted-foreground hidden sm:block">{row.phone}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">G{row.gradeLevel}</TableCell>
                      <TableCell>
                        <div className="font-medium text-xs sm:text-sm line-clamp-1">{row.bookTitle}</div>
                        <div className="text-[10px] text-muted-foreground">{row.accessionNumber}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-[10px] py-0 whitespace-nowrap">{row.daysOverdue} d</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        ₱{row.replacementCost}
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

function FinancialReport() {
  const financial = useQuery(api.transactions.getFinancialSummary, {});

  return (
    <div className="space-y-6">
      {/* Summary Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <IconCurrency className="h-3 w-3" />
            Total Value
          </span>
          <div className="text-xl sm:text-2xl font-bold">
            ₱{financial?.totalCollectionValue?.toLocaleString() ?? "-"}
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borrowed</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600">
            ₱{financial?.borrowedValue?.toLocaleString() ?? "0"}
          </div>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
            {financial?.activeLoansCount ?? 0} items out
          </p>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider text-red-600">Overdue</span>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            ₱{financial?.overdueValue?.toLocaleString() ?? "0"}
          </div>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
            {financial?.overdueLoansCount ?? 0} items overdue
          </p>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-red-200 bg-red-50 dark:bg-red-950/20">
          <span className="text-[10px] sm:text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
            Value at Risk
          </span>
          <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">
            ₱{financial?.valueAtRisk?.toLocaleString() ?? "0"}
          </div>
          <p className="text-[10px] text-red-600/70 dark:text-red-400/70 whitespace-nowrap">
            Overdue + Missing
          </p>
        </Card>
      </div>

      {/* Missing Items */}
      <Card>
        <CardHeader className="px-4 py-4 border-b">
          <CardTitle className="text-base">Missing Book Value</CardTitle>
          <CardDescription className="text-xs">
            Total replacement cost for items marked as missing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-3xl font-bold text-red-600">
            ₱{financial?.missingValue?.toLocaleString() ?? "0"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
