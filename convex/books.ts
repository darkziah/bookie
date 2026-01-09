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

// List all books with optional filters
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("borrowed"),
        v.literal("reserved"),
        v.literal("missing"),
        v.literal("damaged"),
        v.literal("weeded")
      )
    ),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.status) {
      const books = await ctx.db
        .query("books")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .order("desc")
        .take(args.limit ?? 100);
      return books;
    }

    if (args.category) {
      const books = await ctx.db
        .query("books")
        .withIndex("by_category", (q: any) => q.eq("category", args.category))
        .order("desc")
        .take(args.limit ?? 100);
      return books;
    }

    const books = await ctx.db
      .query("books")
      .order("desc")
      .take(args.limit ?? 100);
    return books;
  },
});

// Search books by title
export const searchByTitle = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.searchTerm.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("books")
      .withSearchIndex("search_title", (q: any) =>
        q.search("title", args.searchTerm)
      )
      .take(20);

    return results;
  },
});

// Search books by author
export const searchByAuthor = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.searchTerm.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("books")
      .withSearchIndex("search_author", (q: any) =>
        q.search("author", args.searchTerm)
      )
      .take(20);

    return results;
  },
});

// Get book by accession number (barcode)
export const getByAccession = query({
  args: { accessionNumber: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const book = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) =>
        q.eq("accessionNumber", args.accessionNumber)
      )
      .first();

    if (!book) return null;

    // Get current loan if borrowed
    let currentLoan = null;
    if (book.status === "borrowed") {
      const loan = await ctx.db
        .query("transactions")
        .withIndex("by_book", (q: any) => q.eq("bookId", book._id))
        .filter((q: any) => q.eq(q.field("isReturned"), false))
        .first();

      if (loan) {
        const student = await ctx.db.get(loan.studentId);
        currentLoan = { ...loan, student };
      }
    }

    return { ...book, currentLoan };
  },
});

// Get book by ISBN (may return multiple copies)
export const getByIsbn = query({
  args: { isbn: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const books = await ctx.db
      .query("books")
      .withIndex("by_isbn", (q: any) => q.eq("isbn", args.isbn))
      .collect();

    return books;
  },
});

// Get book by document ID
export const get = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);
    return await ctx.db.get(args.id);
  },
});

// Create new book
export const create = mutation({
  args: {
    isbn: v.optional(v.string()),
    accessionNumber: v.string(),
    title: v.string(),
    author: v.string(),
    coAuthors: v.optional(v.array(v.string())),
    publisher: v.optional(v.string()),
    publicationYear: v.optional(v.number()),
    edition: v.optional(v.string()),
    category: v.string(),
    genre: v.optional(v.string()),
    deweyDecimal: v.optional(v.string()),
    coverId: v.optional(v.id("_storage")),
    condition: v.union(
      v.literal("new"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("poor"),
      v.literal("damaged")
    ),
    replacementCost: v.number(),
    location: v.string(),
    summary: v.optional(v.string()),
    marcData: v.optional(v.string()),
    pages: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    // Check for duplicate accession number
    const existing = await ctx.db
      .query("books")
      .withIndex("by_accession", (q: any) =>
        q.eq("accessionNumber", args.accessionNumber)
      )
      .first();

    if (existing) {
      throw new Error(`Accession number ${args.accessionNumber} already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("books", {
      ...args,
      status: "available",
      totalBorrows: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update book
export const update = mutation({
  args: {
    id: v.id("books"),
    isbn: v.optional(v.string()),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    coAuthors: v.optional(v.array(v.string())),
    publisher: v.optional(v.string()),
    publicationYear: v.optional(v.number()),
    edition: v.optional(v.string()),
    category: v.optional(v.string()),
    genre: v.optional(v.string()),
    deweyDecimal: v.optional(v.string()),
    coverId: v.optional(v.id("_storage")),
    condition: v.optional(
      v.union(
        v.literal("new"),
        v.literal("good"),
        v.literal("fair"),
        v.literal("poor"),
        v.literal("damaged")
      )
    ),
    replacementCost: v.optional(v.number()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    marcData: v.optional(v.string()),
    pages: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Update book status
export const updateStatus = mutation({
  args: {
    id: v.id("books"),
    status: v.union(
      v.literal("available"),
      v.literal("borrowed"),
      v.literal("reserved"),
      v.literal("missing"),
      v.literal("damaged"),
      v.literal("weeded")
    ),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Delete book (admin only)
export const remove = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin"]);

    const book = await ctx.db.get(args.id);
    if (book?.status === "borrowed") {
      throw new Error("Cannot delete a borrowed book");
    }

    await ctx.db.delete(args.id);
  },
});

// Get book statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const allBooks = await ctx.db.query("books").collect();

    const statusCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalValue = 0;

    for (const book of allBooks) {
      statusCounts[book.status] = (statusCounts[book.status] || 0) + 1;
      categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
      totalValue += book.replacementCost;
    }

    return {
      total: allBooks.length,
      statusCounts,
      categoryCounts,
      totalValue,
    };
  },
});

// Get most popular books
export const getMostPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const books = await ctx.db.query("books").collect();

    // Sort by total borrows
    const sorted = books
      .sort((a: any, b: any) => b.totalBorrows - a.totalBorrows)
      .slice(0, args.limit ?? 10);

    return sorted;
  },
});

// Get weeding candidates (books not borrowed in X days)
export const getWeedingCandidates = query({
  args: { daysSinceLastBorrow: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const days = args.daysSinceLastBorrow ?? 730; // Default 2 years
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const books = await ctx.db.query("books").collect();

    const candidates = books.filter((book: any) => {
      if (book.status === "weeded") return false;
      if (!book.lastBorrowedAt) return true; // Never borrowed
      return book.lastBorrowedAt < cutoffDate;
    });

    return candidates;
  },
});

// Generate next accession number
export const getNextAccessionNumber = query({
  args: { prefix: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const prefix = args.prefix ?? "B";
    const year = new Date().getFullYear();

    // Get all books with matching prefix pattern
    const books = await ctx.db.query("books").collect();
    const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);

    let maxNumber = 0;
    for (const book of books) {
      const match = book.accessionNumber.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    const nextNumber = String(maxNumber + 1).padStart(4, "0");
    return `${prefix}-${year}-${nextNumber}`;
  },
});

// Generate upload URL for cover images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx, ["admin", "staff"]);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get cover image URL from storage ID
export const getCoverUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Bulk create books (for CSV import)
export const bulkCreate = mutation({
  args: {
    books: v.array(
      v.object({
        isbn: v.optional(v.string()),
        accessionNumber: v.string(),
        title: v.string(),
        author: v.string(),
        coAuthors: v.optional(v.array(v.string())),
        publisher: v.optional(v.string()),
        publicationYear: v.optional(v.number()),
        edition: v.optional(v.string()),
        category: v.string(),
        genre: v.optional(v.string()),
        deweyDecimal: v.optional(v.string()),
        condition: v.union(
          v.literal("new"),
          v.literal("good"),
          v.literal("fair"),
          v.literal("poor"),
          v.literal("damaged")
        ),
        replacementCost: v.number(),
        location: v.string(),
        pages: v.optional(v.number()),
        language: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const now = Date.now();

    for (const book of args.books) {
      // Check for duplicate accession number
      const existing = await ctx.db
        .query("books")
        .withIndex("by_accession", (q: any) =>
          q.eq("accessionNumber", book.accessionNumber)
        )
        .first();

      if (existing) {
        results.skipped++;
        results.errors.push(`Duplicate: ${book.accessionNumber}`);
        continue;
      }

      try {
        await ctx.db.insert("books", {
          ...book,
          status: "available",
          totalBorrows: 0,
          createdAt: now,
          updatedAt: now,
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`${book.accessionNumber}: ${error.message}`);
      }
    }

    return results;
  },
});

// Check for duplicate accession numbers
export const checkDuplicates = query({
  args: { accessionNumbers: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const duplicates: string[] = [];

    for (const accNum of args.accessionNumbers) {
      const existing = await ctx.db
        .query("books")
        .withIndex("by_accession", (q: any) =>
          q.eq("accessionNumber", accNum)
        )
        .first();

      if (existing) {
        duplicates.push(accNum);
      }
    }

    return duplicates;
  },
});

// Mark book as inventoried
export const markInventoried = mutation({
  args: {
    id: v.id("books"),
    condition: v.optional(
      v.union(
        v.literal("new"),
        v.literal("good"),
        v.literal("fair"),
        v.literal("poor"),
        v.literal("damaged")
      )
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const updates: Record<string, any> = {
      lastInventoriedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (args.condition) {
      updates.condition = args.condition;
    }

    if (args.notes) {
      updates.inventoryNotes = args.notes;
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Get inventory status for discrepancy detection
export const getInventoryStatus = query({
  args: {
    sinceDate: v.optional(v.number()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const allBooks = await ctx.db.query("books").collect();
    const cutoffDate = args.sinceDate || Date.now() - 24 * 60 * 60 * 1000; // Default: last 24 hours

    let filteredBooks = allBooks;

    if (args.location) {
      filteredBooks = filteredBooks.filter((b: any) => b.location === args.location);
    }
    if (args.category) {
      filteredBooks = filteredBooks.filter((b: any) => b.category === args.category);
    }

    const inventoried = filteredBooks.filter(
      (b: any) => b.lastInventoriedAt && b.lastInventoriedAt >= cutoffDate
    );
    const notInventoried = filteredBooks.filter(
      (b: any) => !b.lastInventoriedAt || b.lastInventoriedAt < cutoffDate
    );
    const missing = notInventoried.filter((b: any) => b.status === "available");

    return {
      total: filteredBooks.length,
      inventoried: inventoried.length,
      notInventoried: notInventoried.length,
      potentiallyMissing: missing.length,
      inventoriedBooks: inventoried,
      missingBooks: missing.slice(0, 50), // Top 50 for display
    };
  },
});

// Get all unique locations
export const getLocations = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const books = await ctx.db.query("books").collect();
    const locations = [...new Set(books.map((b: any) => b.location))].filter(Boolean);
    return locations.sort();
  },
});

// Get all unique categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const books = await ctx.db.query("books").collect();
    const categories = [...new Set(books.map((b: any) => b.category))].filter(Boolean);
    return categories.sort();
  },
});

