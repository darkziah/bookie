import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Kiosk-specific API endpoints
 * These endpoints are designed for student self-service kiosks
 * and do NOT require librarian authentication.
 * 
 * Security considerations:
 * - Only read access to limited student info
 * - Checkout/checkin operations are logged with "kiosk" as the device
 * - No access to sensitive data like guardian phone numbers
 */

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

// Get student by ID (barcode) - KIOSK VERSION (no auth required)
export const getStudentById = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();

    if (!student) return null;

    // Get current active loans
    const activeLoans = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q: any) => q.eq("studentId", student._id))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .collect();

    // Get loan details with book info (limited info for kiosk)
    const loansWithBooks = await Promise.all(
      activeLoans.map(async (loan: any) => {
        const book = await ctx.db.get(loan.bookId as Id<"books">);
        return {
          _id: loan._id,
          dueDate: loan.dueDate,
          isOverdue: loan.dueDate < Date.now(),
          book: book ? {
            title: book.title,
            author: book.author,
            accessionNumber: book.accessionNumber,
          } : null,
        };
      })
    );

    // Return limited student info for privacy
    return {
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
      gradeLevel: student.gradeLevel,
      section: student.section,
      borrowingLimit: student.borrowingLimit,
      isBlocked: student.isBlocked,
      blockReason: student.blockReason,
      activeLoans: loansWithBooks,
      activeLoanCount: activeLoans.length,
      hasOverdue: activeLoans.some((loan: any) => loan.dueDate < Date.now()),
    };
  },
});

// Get book by accession number - KIOSK VERSION (no auth required)
export const getBookByAccession = query({
  args: { accessionNumber: v.string() },
  handler: async (ctx, args) => {
    const book = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) => q.eq("accessionNumber", args.accessionNumber))
      .first();

    if (!book) return null;

    // Return limited book info for kiosk display
    return {
      _id: book._id,
      title: book.title,
      author: book.author,
      accessionNumber: book.accessionNumber,
      status: book.status,
      coverId: book.coverId,
    };
  },
});

// Checkout a book - KIOSK VERSION (no auth required)
export const checkout = mutation({
  args: {
    studentId: v.id("students"),
    accessionNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Get student
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    if (student.isBlocked) {
      throw new Error(`Account blocked: ${student.blockReason || "Contact librarian"}`);
    }

    // Get book by accession number
    const book = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) => q.eq("accessionNumber", args.accessionNumber))
      .first();

    if (!book) {
      throw new Error("Book not found. Please check the accession number.");
    }
    if (book.status !== "available") {
      throw new Error(`This book is not available (Status: ${book.status})`);
    }

    // Check active loans count
    const activeLoans = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .collect();

    if (activeLoans.length >= student.borrowingLimit) {
      throw new Error(
        `Borrowing limit reached (${activeLoans.length}/${student.borrowingLimit}). Return a book first.`
      );
    }

    // Check for overdue books
    const overdueLoans = activeLoans.filter(
      (loan: any) => loan.dueDate < Date.now()
    );
    if (overdueLoans.length > 0) {
      throw new Error(
        `You have ${overdueLoans.length} overdue book(s). Please return them first.`
      );
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

    // Create transaction (without librarianId - kiosk checkout)
    const transactionId = await ctx.db.insert("transactions", {
      studentId: args.studentId,
      bookId: book._id,
      checkoutDate: Date.now(),
      dueDate,
      isReturned: false,
      isOverdue: false,
      renewalCount: 0,
      maxRenewals,
      device: "kiosk",
    });

    // Update book status
    await ctx.db.patch(book._id, {
      status: "borrowed",
      lastBorrowedAt: Date.now(),
      totalBorrows: (book.totalBorrows ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Create audit log (without librarianId for kiosk)
    await ctx.db.insert("auditLogs", {
      action: "checkout",
      entityType: "transaction",
      entityId: transactionId,
      details: JSON.stringify({
        studentId: args.studentId,
        studentName: student.name,
        bookId: book._id,
        bookTitle: book.title,
        accessionNumber: args.accessionNumber,
        dueDate,
        source: "kiosk",
      }),
      device: "kiosk",
      timestamp: Date.now(),
    });

    return {
      transactionId,
      dueDate,
      bookTitle: book.title,
      studentName: student.name,
    };
  },
});

// Return a book - KIOSK VERSION (no auth required)
export const checkin = mutation({
  args: {
    accessionNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Get book by accession number
    const book = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) => q.eq("accessionNumber", args.accessionNumber))
      .first();

    if (!book) {
      throw new Error("Book not found. Please check the accession number.");
    }

    // Find active transaction
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_book", (q: any) => q.eq("bookId", book._id))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .first();

    if (!transaction) {
      throw new Error("This book is not currently checked out.");
    }

    const returnDate = Date.now();
    const wasOverdue = transaction.dueDate < returnDate;

    // Get student for the success message
    const student = await ctx.db.get(transaction.studentId);

    // Update transaction
    await ctx.db.patch(transaction._id, {
      returnDate,
      isReturned: true,
      isOverdue: wasOverdue,
    });

    // Update book status
    await ctx.db.patch(book._id, {
      status: "available",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "checkin",
      entityType: "transaction",
      entityId: transaction._id,
      details: JSON.stringify({
        studentId: transaction.studentId,
        studentName: student?.name,
        bookId: book._id,
        bookTitle: book.title,
        accessionNumber: args.accessionNumber,
        wasOverdue,
        daysOverdue: wasOverdue
          ? Math.floor((returnDate - transaction.dueDate) / (24 * 60 * 60 * 1000))
          : 0,
        source: "kiosk",
      }),
      device: "kiosk",
      timestamp: Date.now(),
    });

    return {
      transactionId: transaction._id,
      wasOverdue,
      daysOverdue: wasOverdue
        ? Math.floor((returnDate - transaction.dueDate) / (24 * 60 * 60 * 1000))
        : 0,
      bookTitle: book.title,
      studentName: student?.name,
    };
  },
});
