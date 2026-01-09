import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import {
  IconBook,
  IconUsers,
  IconArrowUpRight,
  IconAlertTriangle,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Skeleton } from "@bookie/ui/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <DashboardContent />
    </AppLayout>
  );
}

function DashboardContent() {
  const { librarian } = useAuth();
  const bookStats = useQuery(api.books.getStats, {});
  const studentStats = useQuery(api.students.getStats, {});
  const circulationStats = useQuery(api.transactions.getStats, {});
  const overdueTransactions = useQuery(api.transactions.getOverdue, {});
  const recentTransactions = useQuery(api.transactions.getRecent, { limit: 5 });

  const isLoading =
    bookStats === undefined ||
    studentStats === undefined ||
    circulationStats === undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header - Hidden on small mobile to save space since title is in AppLayout */}
      <div className="hidden sm:block">
        <p className="text-muted-foreground">
          Welcome back, {librarian?.name || "Librarian"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Books */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {bookStats?.total.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bookStats?.statusCounts?.available || 0} available
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {studentStats?.total.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {studentStats?.blocked || 0} blocked
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Loans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <IconArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {circulationStats?.currentActiveLoans || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {circulationStats?.totalCheckouts || 0} checkouts this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className={overdueTransactions?.length ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <IconAlertTriangle
              className={`h-4 w-4 ${overdueTransactions?.length
                ? "text-destructive"
                : "text-muted-foreground"
                }`}
            />
          </CardHeader>
          <CardContent>
            {overdueTransactions === undefined ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${overdueTransactions.length ? "text-destructive" : ""
                    }`}
                >
                  {overdueTransactions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overdueTransactions.length ? "Needs attention" : "All clear!"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Overdue */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest circulation activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions === undefined ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((t: any) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {t.book?.title || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.student?.name || "Unknown Student"}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${t.isReturned
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                      >
                        {t.isReturned ? "Returned" : "Checked Out"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
              Overdue Books
            </CardTitle>
            <CardDescription>Books past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueTransactions === undefined ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : overdueTransactions.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <IconTrendingUp className="h-8 w-8 text-green-500 mb-2" />
                <p className="font-medium">All clear!</p>
                <p className="text-muted-foreground text-sm">
                  No overdue books at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueTransactions.slice(0, 5).map((t: any) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {t.book?.title || "Unknown Book"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.student?.name || "Unknown Student"}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <span className="text-[10px] font-medium text-destructive whitespace-nowrap">
                        {t.daysOverdue} days overdue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

