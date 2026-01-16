import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

// Record a fee payment
export const recordPayment = mutation({
  args: {
    studentId: v.optional(v.id("students")),
    facultyId: v.optional(v.id("faculty")),
    transactionId: v.optional(v.id("transactions")),
    amount: v.number(),
    reason: v.union(
      v.literal("overdue"),
      v.literal("lost_book"),
      v.literal("damaged_book"),
      v.literal("other")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const librarian = await requireLibrarian(ctx);

    if (!args.studentId && !args.facultyId) {
      throw new Error("Must provide either studentId or facultyId");
    }

    // Create payment record
    const paymentId = await ctx.db.insert("feePayments", {
      studentId: args.studentId,
      facultyId: args.facultyId,
      transactionId: args.transactionId,
      amount: args.amount,
      reason: args.reason,
      notes: args.notes,
      paidAt: Date.now(),
      receivedBy: librarian._id,
    });

    // Reduce outstanding fees on patron
    if (args.studentId) {
      const student = await ctx.db.get(args.studentId);
      if (student) {
        const newFees = Math.max(0, (student.outstandingFees ?? 0) - args.amount);
        await ctx.db.patch(args.studentId, {
          outstandingFees: newFees,
          updatedAt: Date.now(),
        });
      }
    } else if (args.facultyId) {
      const faculty = await ctx.db.get(args.facultyId);
      if (faculty) {
        const newFees = Math.max(0, (faculty.outstandingFees ?? 0) - args.amount);
        await ctx.db.patch(args.facultyId, {
          outstandingFees: newFees,
          updatedAt: Date.now(),
        });
      }
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: librarian.userId,
      librarianId: librarian._id,
      action: "fee_payment",
      entityType: "feePayment",
      entityId: paymentId,
      details: JSON.stringify({
        studentId: args.studentId,
        facultyId: args.facultyId,
        amount: args.amount,
        reason: args.reason,
      }),
      timestamp: Date.now(),
    });

    return { paymentId };
  },
});

// Get payments report
export const getPaymentsReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    reason: v.optional(
      v.union(
        v.literal("overdue"),
        v.literal("lost_book"),
        v.literal("damaged_book"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const startDate = args.startDate ?? now - 30 * 24 * 60 * 60 * 1000; // Default last 30 days
    const endDate = args.endDate ?? now;

    let payments = await ctx.db
      .query("feePayments")
      .withIndex("by_paid_at")
      .order("desc")
      .collect();

    // Filter by date range
    payments = payments.filter(
      (p: any) => p.paidAt >= startDate && p.paidAt <= endDate
    );

    // Filter by reason if provided
    if (args.reason) {
      payments = payments.filter((p: any) => p.reason === args.reason);
    }

    // Enrich with patron and librarian data
    const enriched = await Promise.all(
      payments.map(async (p: any) => {
        let patron = null;
        let patronType = "";

        if (p.studentId) {
          patron = await ctx.db.get(p.studentId);
          patronType = "student";
        } else if (p.facultyId) {
          patron = await ctx.db.get(p.facultyId);
          patronType = "faculty";
        }

        const librarian = await ctx.db.get(p.receivedBy);

        return {
          ...p,
          patronName: (patron as any)?.name ?? "Unknown",
          patronId: patronType === "student"
            ? (patron as any)?.studentId
            : (patron as any)?.facultyId,
          patronType,
          receivedByName: (librarian as any)?.name ?? "Unknown",
        };
      })
    );

    // Calculate totals
    const totalAmount = enriched.reduce((sum: number, p: any) => sum + p.amount, 0);
    const byReason = enriched.reduce((acc: Record<string, number>, p: any) => {
      acc[p.reason] = (acc[p.reason] ?? 0) + p.amount;
      return acc;
    }, {});

    return {
      payments: enriched,
      totalAmount,
      byReason,
      count: enriched.length,
    };
  },
});

// Get patron's outstanding fees
export const getPatronFees = query({
  args: {
    studentId: v.optional(v.id("students")),
    facultyId: v.optional(v.id("faculty")),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (!args.studentId && !args.facultyId) {
      throw new Error("Must provide either studentId or facultyId");
    }

    let patron = null;
    let payments: any[] = [];

    if (args.studentId) {
      patron = await ctx.db.get(args.studentId);
      payments = await ctx.db
        .query("feePayments")
        .withIndex("by_student", (q: any) => q.eq("studentId", args.studentId))
        .order("desc")
        .collect();
    } else if (args.facultyId) {
      patron = await ctx.db.get(args.facultyId);
      payments = await ctx.db
        .query("feePayments")
        .withIndex("by_faculty", (q: any) => q.eq("facultyId", args.facultyId))
        .order("desc")
        .collect();
    }

    return {
      outstandingFees: patron?.outstandingFees ?? 0,
      paymentHistory: payments,
    };
  },
});
