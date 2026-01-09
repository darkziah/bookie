import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper to check if user is authenticated librarian
async function requireLibrarian(ctx: any, roles?: string[]) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const librarian = await ctx.db
    .query("librarians")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!librarian || !librarian.isActive) {
    throw new Error("Unauthorized: Librarian access required");
  }

  if (roles && !roles.includes(librarian.role)) {
    throw new Error(`Unauthorized: Requires ${roles.join(" or ")} role`);
  }

  return librarian;
}

// Internal function to check overdue books (called by cron)
export const checkOverdueBooks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all active loans that are overdue
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_returned", (q: any) => q.eq("isReturned", false))
      .collect();

    const overdueTransactions = transactions.filter((t: any) => t.dueDate < now);

    // Update isOverdue flag for transactions that became overdue
    for (const t of overdueTransactions) {
      if (!t.isOverdue) {
        await ctx.db.patch(t._id, { isOverdue: true });
      }
    }

    // Log the check
    await ctx.db.insert("auditLogs", {
      action: "cron_overdue_check",
      entityType: "transaction",
      entityId: "system",
      details: JSON.stringify({
        overdueCount: overdueTransactions.length,
        checkedAt: now,
      }),
      timestamp: now,
    });

    return {
      overdueCount: overdueTransactions.length,
      checkedAt: now,
    };
  },
});

// Internal function to generate weekly summary (called by cron)
export const generateWeeklySummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get transactions from the past week
    const transactions = await ctx.db.query("transactions").collect();
    const weekTransactions = transactions.filter(
      (t: any) => t.checkoutDate >= weekAgo && t.checkoutDate <= now
    );

    const summary = {
      totalCheckouts: weekTransactions.length,
      totalReturns: weekTransactions.filter((t: any) => t.isReturned).length,
      overdueReturns: weekTransactions.filter((t: any) => t.isOverdue && t.isReturned).length,
      currentlyOverdue: transactions.filter((t: any) => !t.isReturned && t.dueDate < now).length,
      generatedAt: now,
      periodStart: weekAgo,
      periodEnd: now,
    };

    // Store the summary in audit logs
    await ctx.db.insert("auditLogs", {
      action: "cron_weekly_summary",
      entityType: "report",
      entityId: "weekly",
      details: JSON.stringify(summary),
      timestamp: now,
    });

    return summary;
  },
});

// Internal function to generate monthly summary (called by cron)
export const generateMonthlySummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all books and calculate inventory status
    const books = await ctx.db.query("books").collect();
    const transactions = await ctx.db.query("transactions").collect();

    const monthTransactions = transactions.filter(
      (t: any) => t.checkoutDate >= monthAgo && t.checkoutDate <= now
    );

    // Find books that haven't been borrowed in 6 months (weeding candidates)
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const weedingCandidates = books.filter(
      (b: any) => !b.lastBorrowedAt || b.lastBorrowedAt < sixMonthsAgo
    );

    const summary = {
      totalBooks: books.length,
      availableBooks: books.filter((b: any) => b.status === "available").length,
      borrowedBooks: books.filter((b: any) => b.status === "borrowed").length,
      missingBooks: books.filter((b: any) => b.status === "missing").length,
      monthlyCheckouts: monthTransactions.length,
      monthlyReturns: monthTransactions.filter((t: any) => t.isReturned).length,
      weedingCandidatesCount: weedingCandidates.length,
      totalCollectionValue: books.reduce((sum: number, b: any) => sum + (b.replacementCost || 0), 0),
      generatedAt: now,
      periodStart: monthAgo,
      periodEnd: now,
    };

    // Store the summary
    await ctx.db.insert("auditLogs", {
      action: "cron_monthly_summary",
      entityType: "report",
      entityId: "monthly",
      details: JSON.stringify(summary),
      timestamp: now,
    });

    return summary;
  },
});

// Get scheduled report history
export const getScheduledReportHistory = query({
  args: {
    reportType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    let logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .collect();

    // Filter by report type if specified
    if (args.reportType) {
      const actionType = `cron_${args.reportType}_summary`;
      logs = logs.filter((l: any) => l.action === actionType || l.action === "cron_overdue_check");
    } else {
      logs = logs.filter((l: any) =>
        l.action === "cron_weekly_summary" ||
        l.action === "cron_monthly_summary" ||
        l.action === "cron_overdue_check"
      );
    }

    return logs.slice(0, args.limit || 20);
  },
});
