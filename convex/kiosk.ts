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

// Get public settings for kiosk display (no auth required)
export const getKioskSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();

    // Only return public/kiosk-relevant settings
    const publicKeys = ["schoolName", "libraryName", "kioskTimeout"];
    const result: Record<string, any> = {};

    for (const setting of settings) {
      if (publicKeys.includes(setting.key)) {
        result[setting.key] = setting.value;
      }
    }

    return {
      schoolName: result.schoolName ?? "School Library",
      libraryName: result.libraryName ?? "Library Management System",
      kioskTimeout: result.kioskTimeout ?? 30,
    };
  },
});

// Calculate due date - includes weekends, only skips holidays
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
    const dateKey = `${dueDate.getFullYear()}-${dueDate.getMonth()}-${dueDate.getDate()}`;

    // Skip holidays only (weekends are now included)
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

// Get book by code (accession number or ISBN) - KIOSK VERSION (no auth required)
// This is the primary lookup for the kiosk scanner - returns single book for accession
export const getBookByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim();

    // First try by accession number (exact match)
    let book = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) => q.eq("accessionNumber", code))
      .first();

    // If not found, try by ISBN
    if (!book) {
      // Clean ISBN (remove hyphens and spaces)
      const cleanIsbn = code.replace(/[-\s]/g, "");

      // Try to find by ISBN - get first available copy
      const booksByIsbn = await ctx.db
        .query("books")
        .withIndex("by_isbn", (q: any) => q.eq("isbn", cleanIsbn))
        .collect();

      // Prefer an available copy
      book = booksByIsbn.find((b: any) => b.status === "available") ?? booksByIsbn[0] ?? null;
    }

    if (!book) return null;

    // Return book info for kiosk display
    return {
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      accessionNumber: book.accessionNumber,
      status: book.status,
      coverId: book.coverId,
      // Flag to indicate if this was found by ISBN (might have multiple copies)
      foundByIsbn: code.replace(/[-\s]/g, "") === book.isbn,
    };
  },
});

// Get all books by ISBN with pagination - KIOSK VERSION (no auth required)
// Used when ISBN is scanned and we need to show all copies
export const getBooksByIsbnPaginated = query({
  args: {
    isbn: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cleanIsbn = args.isbn.replace(/[-\s]/g, "");
    const limit = args.limit ?? 10;

    // Get all books with this ISBN
    const allBooks = await ctx.db
      .query("books")
      .withIndex("by_isbn", (q: any) => q.eq("isbn", cleanIsbn))
      .collect();

    if (allBooks.length === 0) {
      return {
        books: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
    }

    // Simple cursor-based pagination using index
    const cursorIndex = args.cursor
      ? allBooks.findIndex((b: any) => b._id === args.cursor)
      : 0;
    const startIndex = cursorIndex >= 0 ? cursorIndex : 0;
    const paginatedBooks = allBooks.slice(startIndex, startIndex + limit + 1);

    const hasMore = paginatedBooks.length > limit;
    const booksToReturn = hasMore ? paginatedBooks.slice(0, limit) : paginatedBooks;
    const lastBook = booksToReturn[booksToReturn.length - 1];

    return {
      books: booksToReturn.map((book: any) => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        accessionNumber: book.accessionNumber,
        status: book.status,
        coverId: book.coverId,
        location: book.location,
      })),
      totalCount: allBooks.length,
      availableCount: allBooks.filter((b: any) => b.status === "available").length,
      hasMore,
      nextCursor: hasMore && lastBook ? lastBook._id : null,
    };
  },
});

// Detect code type (accession vs ISBN) - KIOSK VERSION (no auth required)
// Returns the type of code and count of matching books
export const detectCodeType = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim();
    const cleanCode = code.replace(/[-\s]/g, "");

    // Check if it's an ISBN-like pattern (10 or 13 digits, or with check digit X)
    const isIsbnPattern = /^(?:\d{10}|\d{13}|\d{9}X)$/i.test(cleanCode);

    // Try exact accession number match first
    const bookByAccession = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) => q.eq("accessionNumber", code))
      .first();

    if (bookByAccession) {
      return {
        type: "accession" as const,
        code: code,
        book: {
          _id: bookByAccession._id,
          title: bookByAccession.title,
          author: bookByAccession.author,
          isbn: bookByAccession.isbn,
          accessionNumber: bookByAccession.accessionNumber,
          status: bookByAccession.status,
          coverId: bookByAccession.coverId,
        },
        count: 1,
      };
    }

    // Try ISBN lookup
    if (isIsbnPattern) {
      const booksByIsbn = await ctx.db
        .query("books")
        .withIndex("by_isbn", (q: any) => q.eq("isbn", cleanCode))
        .collect();

      if (booksByIsbn.length > 0) {
        return {
          type: "isbn" as const,
          code: cleanCode,
          book: null,
          count: booksByIsbn.length,
          availableCount: booksByIsbn.filter((b: any) => b.status === "available").length,
        };
      }
    }

    // Not found
    return {
      type: "unknown" as const,
      code: code,
      book: null,
      count: 0,
    };
  },
});

// Verify librarian for override - KIOSK VERSION
export const verifyLibrarian = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Find librarian by employeeId (scanned code)
    const librarian = await ctx.db
      .query("librarians")
      .filter((q) => q.eq(q.field("employeeId"), args.code))
      .first();

    if (!librarian) {
      throw new Error("Invalid staff ID.");
    }

    if (!librarian.isActive) {
      throw new Error("Staff account is inactive.");
    }

    return {
      _id: librarian._id,
      name: librarian.name,
      role: librarian.role
    };
  },
});

// Checkout a book - KIOSK VERSION (no auth required)
export const checkout = mutation({
  args: {
    studentId: v.id("students"),
    accessionNumber: v.string(),
    overrideLibrarianId: v.optional(v.id("librarians")),
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

    if (activeLoans.length >= student.borrowingLimit && !args.overrideLibrarianId) {
      throw new Error(
        `Borrowing limit reached (${activeLoans.length}/${student.borrowingLimit}). Return a book first.`
      );
    }

    // If override is provided, verify it exists (double check)
    let overrideLibrarian = null;
    if (args.overrideLibrarianId) {
      overrideLibrarian = await ctx.db.get(args.overrideLibrarianId);
      if (!overrideLibrarian) {
        throw new Error("Invalid override staff ID provided.");
      }
    }

    // Check for overdue books
    const overdueLoans = activeLoans.filter(
      (loan: any) => loan.dueDate < Date.now()
    );
    if (overdueLoans.length > 0 && !args.overrideLibrarianId) {
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

    // Create transaction (without librarianId - kiosk checkout, unless override)
    const transactionId = await ctx.db.insert("transactions", {
      studentId: args.studentId,
      bookId: book._id,
      librarianId: args.overrideLibrarianId, // Record who authorized if overridden
      checkoutDate: Date.now(),
      dueDate,
      isReturned: false,
      isOverdue: false,
      renewalCount: 0,
      maxRenewals,
      device: "kiosk",
      notes: args.overrideLibrarianId ? `Override by ${overrideLibrarian?.name}` : undefined,
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
      librarianId: args.overrideLibrarianId,
      details: JSON.stringify({
        studentId: args.studentId,
        studentName: student.name,
        bookId: book._id,
        bookTitle: book.title,
        accessionNumber: args.accessionNumber,
        dueDate,
        source: "kiosk",
        overridden: !!args.overrideLibrarianId,
        overrideBy: overrideLibrarian?.name,
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

    // Get overdue grace period
    const gracePeriodSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "overdueGracePeriod"))
      .first();
    const gracePeriodDays = Number(gracePeriodSetting?.value ?? 0);
    const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;

    // Get overdue fee per day
    const overdueFeePerDaySetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "overdueFeePerDay"))
      .first();
    const overdueFeePerDay = Number(overdueFeePerDaySetting?.value ?? 0);

    const returnDate = Date.now();
    const wasOverdue = transaction.dueDate + gracePeriodMs < returnDate;

    // Calculate days overdue and fee
    const daysOverdue = wasOverdue
      ? Math.floor((returnDate - transaction.dueDate) / (24 * 60 * 60 * 1000))
      : 0;
    const overdueFee = daysOverdue * overdueFeePerDay;

    // Get student for the success message
    const student = transaction.studentId
      ? await ctx.db.get(transaction.studentId)
      : null;
    const studentName = student && 'name' in student ? student.name : undefined;

    // Update patron's outstanding fees if there's a fee
    if (overdueFee > 0 && transaction.studentId && student) {
      await ctx.db.patch(transaction.studentId, {
        outstandingFees: ((student as any).outstandingFees ?? 0) + overdueFee,
        updatedAt: Date.now(),
      });
    }

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
        studentName,
        bookId: book._id,
        bookTitle: book.title,
        accessionNumber: args.accessionNumber,
        wasOverdue,
        daysOverdue,
        overdueFee,
        source: "kiosk",
      }),
      device: "kiosk",
      timestamp: Date.now(),
    });

    return {
      transactionId: transaction._id,
      wasOverdue,
      daysOverdue,
      overdueFee,
      bookTitle: book.title,
      studentName,
    };
  },
});
