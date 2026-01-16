import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
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

// List all faculty with optional filters
export const list = query({
  args: {
    department: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.department !== undefined) {
      const faculty = await ctx.db
        .query("faculty")
        .withIndex("by_department", (q: any) => q.eq("department", args.department))
        .order("desc")
        .take(args.limit ?? 100);
      return faculty;
    }

    if (args.blocked !== undefined) {
      const faculty = await ctx.db
        .query("faculty")
        .withIndex("by_blocked", (q: any) => q.eq("isBlocked", args.blocked))
        .order("desc")
        .take(args.limit ?? 100);
      return faculty;
    }

    const faculty = await ctx.db
      .query("faculty")
      .order("desc")
      .take(args.limit ?? 100);
    return faculty;
  },
});

// Paginated list of faculty
export const paginatedList = query({
  args: {
    paginationOpts: paginationOptsValidator,
    department: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    let q = ctx.db.query("faculty");

    if (args.department) {
      return await q
        .withIndex("by_department", (q: any) => q.eq("department", args.department))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    if (args.blocked !== undefined) {
      return await q
        .withIndex("by_blocked", (q: any) => q.eq("isBlocked", args.blocked))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await q.order("desc").paginate(args.paginationOpts);
  },
});

// Search faculty by name
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.searchTerm.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("faculty")
      .withSearchIndex("search_name", (q: any) =>
        q.search("name", args.searchTerm)
      )
      .take(20);

    return results;
  },
});

// Get faculty by ID (employee ID)
export const getByFacultyId = query({
  args: { facultyId: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const faculty = await ctx.db
      .query("faculty")
      .withIndex("by_facultyId", (q: any) => q.eq("facultyId", args.facultyId))
      .first();

    if (!faculty) return null;

    // Get current active loans
    const activeLoans = await ctx.db
      .query("transactions")
      .withIndex("by_faculty", (q: any) => q.eq("facultyId", faculty._id))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .collect();

    // Get loan details with book info
    const loansWithBooks = await Promise.all(
      activeLoans.map(async (loan: any) => {
        const book = await ctx.db.get(loan.bookId);
        return { ...loan, book };
      })
    );

    return {
      ...faculty,
      activeLoans: loansWithBooks,
      activeLoanCount: activeLoans.length,
      hasOverdue: activeLoans.some((loan: any) => loan.isOverdue),
    };
  },
});

// Get faculty by document ID
export const get = query({
  args: { id: v.id("faculty") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);
    return await ctx.db.get(args.id);
  },
});

// Create new faculty
export const create = mutation({
  args: {
    facultyId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    department: v.string(),
    phone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    borrowingLimit: v.optional(v.number()), // Optional, default to 10?
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    // Check for duplicate faculty ID
    const existing = await ctx.db
      .query("faculty")
      .withIndex("by_facultyId", (q: any) => q.eq("facultyId", args.facultyId))
      .first();

    if (existing) {
      throw new Error(`Faculty ID ${args.facultyId} already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("faculty", {
      ...args,
      borrowingLimit: args.borrowingLimit ?? 10, // Default to 10 for faculty
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update faculty
export const update = mutation({
  args: {
    id: v.id("faculty"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    borrowingLimit: v.optional(v.number()),
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

// Block faculty
export const block = mutation({
  args: {
    id: v.id("faculty"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    await ctx.db.patch(args.id, {
      isBlocked: true,
      blockReason: args.reason,
      updatedAt: Date.now(),
    });
  },
});

// Unblock faculty
export const unblock = mutation({
  args: { id: v.id("faculty") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    await ctx.db.patch(args.id, {
      isBlocked: false,
      blockReason: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete faculty (admin only)
export const remove = mutation({
  args: { id: v.id("faculty") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin"]);

    // Check for active loans
    const activeLoans = await ctx.db
      .query("transactions")
      .withIndex("by_faculty", (q: any) => q.eq("facultyId", args.id))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .first();

    if (activeLoans) {
      throw new Error("Cannot delete faculty with active loans");
    }

    await ctx.db.delete(args.id);
  },
});
