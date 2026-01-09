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

// Calculate due date excluding weekends and holidays
async function calculateDueDate(ctx: any, borrowingDays: number): Promise<number> {
  const holidays = await ctx.db.query("holidays").collect();
  const holidayDates = new Set(
    holidays.map((h: any) => {
      const date = new Date(h.date);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );

  let dueDate = new Date();
  let daysAdded = 0;

  while (daysAdded < borrowingDays) {
    dueDate.setDate(dueDate.getDate() + 1);
    const dayOfWeek = dueDate.getDay();
    const dateKey = `${dueDate.getFullYear()}-${dueDate.getMonth()}-${dueDate.getDate()}`;

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Skip holidays
    if (holidayDates.has(dateKey)) continue;

    daysAdded++;
  }

  // Set time to end of day
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime();
}

// Validate student can borrow
async function validateBorrowing(ctx: any, studentId: any, bookId: any) {
  const student = await ctx.db.get(studentId);
  if (!student) {
    return { valid: false, error: "Student not found" };
  }
  if (student.isBlocked) {
    return { valid: false, error: `Student is blocked: ${student.blockReason}` };
  }

  const book = await ctx.db.get(bookId);
  if (!book) {
    return { valid: false, error: "Book not found" };
  }
  if (book.status !== "available") {
    return { valid: false, error: `Book is not available (status: ${book.status})` };
  }

  // Check active loans count
  const activeLoans = await ctx.db
    .query("transactions")
    .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
    .filter((q: any) => q.eq(q.field("isReturned"), false))
    .collect();

  if (activeLoans.length >= student.borrowingLimit) {
    return {
      valid: false,
      error: `Borrowing limit reached (${activeLoans.length}/${student.borrowingLimit})`,
    };
  }

  // Check for overdue books
  const overdueLoans = activeLoans.filter(
    (loan: any) => loan.dueDate < Date.now()
  );
  if (overdueLoans.length > 0) {
    return {
      valid: false,
      error: `Student has ${overdueLoans.length} overdue book(s)`,
    };
  }

  return { valid: true, student, book, activeLoans };
}

// Check out a book
export const checkOut = mutation({
  args: {
    studentId: v.id("students"),
    bookId: v.id("books"),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const librarian = await requireLibrarian(ctx);

    // Validate
    const validation = await validateBorrowing(ctx, args.studentId, args.bookId);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get borrowing period from settings (default 14 days)
    const borrowingDaysSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "borrowingDays"))
      .first();
    const borrowingDays = borrowingDaysSetting?.value ?? 14;

    // Get max renewals from settings
    const maxRenewalsSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "maxRenewals"))
      .first();
    const maxRenewals = maxRenewalsSetting?.value ?? 2;

    // Calculate due date
    const dueDate = await calculateDueDate(ctx, borrowingDays);

    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      studentId: args.studentId,
      bookId: args.bookId,
      librarianId: librarian._id,
      checkoutDate: Date.now(),
      dueDate,
      isReturned: false,
      isOverdue: false,
      renewalCount: 0,
      maxRenewals,
      device: args.device,
    });

    // Update book status
    await ctx.db.patch(args.bookId, {
      status: "borrowed",
      lastBorrowedAt: Date.now(),
      totalBorrows: (validation.book?.totalBorrows ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: librarian.userId,
      librarianId: librarian._id,
      action: "checkout",
      entityType: "transaction",
      entityId: transactionId,
      details: JSON.stringify({
        studentId: args.studentId,
        bookId: args.bookId,
        dueDate,
      }),
      device: args.device,
      timestamp: Date.now(),
    });

    return { transactionId, dueDate };
  },
});

// Check in a book
export const checkIn = mutation({
  args: {
    bookId: v.id("books"),
    device: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const librarian = await requireLibrarian(ctx);

    // Find active transaction
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .first();

    if (!transaction) {
      throw new Error("No active loan found for this book");
    }

    const returnDate = Date.now();
    const wasOverdue = transaction.dueDate < returnDate;

    // Update transaction
    await ctx.db.patch(transaction._id, {
      returnDate,
      isReturned: true,
      isOverdue: wasOverdue,
      notes: args.notes,
    });

    // Update book status
    await ctx.db.patch(args.bookId, {
      status: "available",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: librarian.userId,
      librarianId: librarian._id,
      action: "checkin",
      entityType: "transaction",
      entityId: transaction._id,
      details: JSON.stringify({
        studentId: transaction.studentId,
        bookId: args.bookId,
        wasOverdue,
        daysOverdue: wasOverdue
          ? Math.floor((returnDate - transaction.dueDate) / (24 * 60 * 60 * 1000))
          : 0,
      }),
      device: args.device,
      timestamp: Date.now(),
    });

    return {
      transactionId: transaction._id,
      wasOverdue,
      daysOverdue: wasOverdue
        ? Math.floor((returnDate - transaction.dueDate) / (24 * 60 * 60 * 1000))
        : 0,
    };
  },
});

// Renew a loan
export const renew = mutation({
  args: {
    transactionId: v.id("transactions"),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const librarian = await requireLibrarian(ctx);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    if (transaction.isReturned) {
      throw new Error("Book has already been returned");
    }
    if (transaction.renewalCount >= transaction.maxRenewals) {
      throw new Error(
        `Maximum renewals (${transaction.maxRenewals}) reached`
      );
    }
    if (transaction.dueDate < Date.now()) {
      throw new Error("Cannot renew overdue books");
    }

    // Get borrowing period from settings
    const borrowingDaysSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "borrowingDays"))
      .first();
    const borrowingDays = borrowingDaysSetting?.value ?? 14;

    // Calculate new due date from current due date
    const newDueDate = await calculateDueDate(ctx, borrowingDays);

    await ctx.db.patch(args.transactionId, {
      dueDate: newDueDate,
      renewalCount: transaction.renewalCount + 1,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: librarian.userId,
      librarianId: librarian._id,
      action: "renew",
      entityType: "transaction",
      entityId: args.transactionId,
      details: JSON.stringify({
        previousDueDate: transaction.dueDate,
        newDueDate,
        renewalCount: transaction.renewalCount + 1,
      }),
      device: args.device,
      timestamp: Date.now(),
    });

    return { newDueDate };
  },
});

// Get active transactions
export const getActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_returned", (q: any) => q.eq("isReturned", false))
      .order("desc")
      .take(args.limit ?? 100);

    // Enrich with student and book data
    const enriched = await Promise.all(
      transactions.map(async (t: any) => {
        const student = await ctx.db.get(t.studentId);
        const book = await ctx.db.get(t.bookId);
        const librarian = t.librarianId
          ? await ctx.db.get(t.librarianId)
          : null;
        return { ...t, student, book, librarian };
      })
    );

    return enriched;
  },
});

// Get overdue transactions
export const getOverdue = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_returned", (q: any) => q.eq("isReturned", false))
      .filter((q: any) => q.lt(q.field("dueDate"), now))
      .collect();

    // Enrich with student and book data
    const enriched = await Promise.all(
      transactions.map(async (t: any) => {
        const student = await ctx.db.get(t.studentId);
        const book = await ctx.db.get(t.bookId);
        const daysOverdue = Math.floor((now - t.dueDate) / (24 * 60 * 60 * 1000));
        return { ...t, student, book, daysOverdue };
      })
    );

    // Sort by days overdue (most overdue first)
    enriched.sort((a: any, b: any) => b.daysOverdue - a.daysOverdue);

    return enriched;
  },
});

// Get student's borrowing history
export const getStudentHistory = query({
  args: {
    studentId: v.id("students"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q: any) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(args.limit ?? 50);

    // Enrich with book data
    const enriched = await Promise.all(
      transactions.map(async (t: any) => {
        const book = await ctx.db.get(t.bookId);
        return { ...t, book };
      })
    );

    return enriched;
  },
});

// Get recent transactions
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(args.limit ?? 20);

    // Enrich with student and book data
    const enriched = await Promise.all(
      transactions.map(async (t: any) => {
        const student = await ctx.db.get(t.studentId);
        const book = await ctx.db.get(t.bookId);
        return { ...t, student, book };
      })
    );

    return enriched;
  },
});

// Get circulation statistics
export const getStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const startDate = args.startDate ?? now - 30 * 24 * 60 * 60 * 1000; // Default last 30 days
    const endDate = args.endDate ?? now;

    const allTransactions = await ctx.db.query("transactions").collect();

    const inPeriod = allTransactions.filter(
      (t: any) => t.checkoutDate >= startDate && t.checkoutDate <= endDate
    );

    const checkouts = inPeriod.length;
    const checkins = inPeriod.filter((t: any) => t.isReturned).length;
    const overdueReturns = inPeriod.filter((t: any) => t.isOverdue).length;

    // Current active loans
    const activeLoans = allTransactions.filter((t: any) => !t.isReturned);
    const currentOverdue = activeLoans.filter(
      (t: any) => t.dueDate < now
    ).length;

    // Average loan duration
    const returnedLoans = inPeriod.filter((t: any) => t.returnDate);
    const avgDuration =
      returnedLoans.length > 0
        ? returnedLoans.reduce(
          (sum: number, t: any) => sum + (t.returnDate! - t.checkoutDate),
          0
        ) /
        returnedLoans.length /
        (24 * 60 * 60 * 1000) // Convert to days
        : 0;

    return {
      totalCheckouts: checkouts,
      totalCheckins: checkins,
      overdueReturns,
      currentActiveLoans: activeLoans.length,
      currentOverdue,
      avgLoanDurationDays: Math.round(avgDuration * 10) / 10,
    };
  },
});

// Validate borrowing (for pre-check warnings)
export const validateBorrow = query({
  args: {
    studentId: v.id("students"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);
    return await validateBorrowing(ctx, args.studentId, args.bookId);
  },
});

// Get circulation stats by time period
export const getCirculationByPeriod = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const transactions = await ctx.db.query("transactions").collect();
    const inRange = transactions.filter(
      (t: any) => t.checkoutDate >= args.startDate && t.checkoutDate <= args.endDate
    );

    // Group by period
    const periods: Record<string, { checkouts: number; returns: number; renewals: number }> = {};

    for (const t of inRange) {
      const date = new Date(t.checkoutDate);
      let key: string;

      if (args.period === "daily") {
        key = date.toISOString().split("T")[0] ?? "";
      } else if (args.period === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0] ?? "";
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!periods[key]) {
        periods[key] = { checkouts: 0, returns: 0, renewals: 0 };
      }
      const period = periods[key];
      if (period) {
        period.checkouts++;
        if ((t as any).isReturned) period.returns++;
        if ((t as any).renewalCount > 0) period.renewals += (t as any).renewalCount;
      }
    }

    return Object.entries(periods)
      .map(([period, stats]) => ({ period, ...stats }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },
});

// Get circulation breakdown by grade level
export const getCirculationByGrade = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const startDate = args.startDate || now - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate || now;

    const transactions = await ctx.db.query("transactions").collect();
    const students = await ctx.db.query("students").collect();

    const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]));

    const inRange = transactions.filter(
      (t: any) => t.checkoutDate >= startDate && t.checkoutDate <= endDate
    );

    // Group by grade
    const grades: Record<number, { checkouts: number; students: Set<string> }> = {};

    for (const t of inRange) {
      const student = studentMap.get(t.studentId.toString());
      if (!student) continue;

      const grade = student.gradeLevel;
      if (!grades[grade]) {
        grades[grade] = { checkouts: 0, students: new Set() };
      }
      grades[grade].checkouts++;
      grades[grade].students.add(t.studentId.toString());
    }

    return Object.entries(grades)
      .map(([grade, stats]) => ({
        grade: parseInt(grade),
        checkouts: stats.checkouts,
        uniqueStudents: stats.students.size,
      }))
      .sort((a, b) => a.grade - b.grade);
  },
});

// Get peak usage times
export const getPeakUsage = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const startDate = args.startDate || now - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate || now;

    const transactions = await ctx.db.query("transactions").collect();
    const inRange = transactions.filter(
      (t: any) => t.checkoutDate >= startDate && t.checkoutDate <= endDate
    );

    // By day of week
    const byDayOfWeek: Record<number, number> = {};
    // By hour
    const byHour: Record<number, number> = {};

    for (const t of inRange) {
      const date = new Date(t.checkoutDate);
      const day = date.getDay();
      const hour = date.getHours();

      byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1;
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return {
      byDayOfWeek: dayNames.map((name, index) => ({
        day: name,
        dayIndex: index,
        count: byDayOfWeek[index] || 0,
      })),
      byHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: `${hour.toString().padStart(2, "0")}:00`,
        count: byHour[hour] || 0,
      })),
    };
  },
});

// Get overdue report with student details
export const getOverdueReport = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const now = Date.now();
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_returned", (q: any) => q.eq("isReturned", false))
      .collect();

    const overdue = transactions.filter((t: any) => t.dueDate < now);

    // Enrich with student and book data
    const enriched = await Promise.all(
      overdue.map(async (t: any) => {
        const student = await ctx.db.get(t.studentId);
        const book = await ctx.db.get(t.bookId);
        const daysOverdue = Math.floor((now - t.dueDate) / (24 * 60 * 60 * 1000));

        // Type assertion for student and book
        const studentData = student as { name?: string; studentId?: string; gradeLevel?: number; phone?: string; guardianPhone?: string } | null;
        const bookData = book as { title?: string; accessionNumber?: string; replacementCost?: number } | null;

        return {
          transactionId: t._id,
          studentName: studentData?.name || "Unknown",
          studentId: studentData?.studentId || "Unknown",
          gradeLevel: studentData?.gradeLevel,
          phone: studentData?.phone || studentData?.guardianPhone,
          bookTitle: bookData?.title || "Unknown",
          accessionNumber: bookData?.accessionNumber,
          replacementCost: bookData?.replacementCost || 0,
          dueDate: t.dueDate,
          daysOverdue,
          checkoutDate: t.checkoutDate,
        };
      })
    );

    return enriched.sort((a, b) => b.daysOverdue - a.daysOverdue);
  },
});

// Get financial summary (replacement costs at risk)
export const getFinancialSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const books = await ctx.db.query("books").collect();
    const transactions = await ctx.db.query("transactions").collect();

    const activeLoans = transactions.filter((t: any) => !t.isReturned);
    const overdueLoans = activeLoans.filter((t: any) => t.dueDate < Date.now());

    let totalCollectionValue = 0;
    let borrowedValue = 0;
    let overdueValue = 0;
    let missingValue = 0;

    const bookMap = new Map(books.map((b: any) => [b._id.toString(), b]));

    for (const book of books) {
      totalCollectionValue += book.replacementCost || 0;
      if (book.status === "missing") {
        missingValue += book.replacementCost || 0;
      }
    }

    for (const loan of activeLoans) {
      const book = bookMap.get(loan.bookId.toString());
      if (book) {
        borrowedValue += book.replacementCost || 0;
      }
    }

    for (const loan of overdueLoans) {
      const book = bookMap.get(loan.bookId.toString());
      if (book) {
        overdueValue += book.replacementCost || 0;
      }
    }

    return {
      totalCollectionValue,
      borrowedValue,
      overdueValue,
      missingValue,
      valueAtRisk: overdueValue + missingValue,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
    };
  },
});

