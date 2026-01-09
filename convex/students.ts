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

// List all students with optional filters
export const list = query({
  args: {
    gradeLevel: v.optional(v.number()),
    blocked: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.gradeLevel !== undefined) {
      const students = await ctx.db
        .query("students")
        .withIndex("by_grade", (q: any) => q.eq("gradeLevel", args.gradeLevel))
        .order("desc")
        .take(args.limit ?? 100);
      return students;
    }

    if (args.blocked !== undefined) {
      const students = await ctx.db
        .query("students")
        .withIndex("by_blocked", (q: any) => q.eq("isBlocked", args.blocked))
        .order("desc")
        .take(args.limit ?? 100);
      return students;
    }

    const students = await ctx.db
      .query("students")
      .order("desc")
      .take(args.limit ?? 100);
    return students;
  },
});

// Search students by name
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    if (args.searchTerm.length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("students")
      .withSearchIndex("search_name", (q: any) =>
        q.search("name", args.searchTerm)
      )
      .take(20);

    return results;
  },
});

// Get student by ID (barcode)
export const getByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

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

    // Get loan details with book info
    const loansWithBooks = await Promise.all(
      activeLoans.map(async (loan: any) => {
        const book = await ctx.db.get(loan.bookId);
        return { ...loan, book };
      })
    );

    return {
      ...student,
      activeLoans: loansWithBooks,
      activeLoanCount: activeLoans.length,
      hasOverdue: activeLoans.some((loan: any) => loan.isOverdue),
    };
  },
});

// Get student by document ID
export const get = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);
    return await ctx.db.get(args.id);
  },
});

// Create new student
export const create = mutation({
  args: {
    studentId: v.string(),
    name: v.string(),
    gradeLevel: v.number(),
    section: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    guardian: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    // Check for duplicate student ID
    const existing = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();

    if (existing) {
      throw new Error(`Student ID ${args.studentId} already exists`);
    }

    // Get default borrowing limit based on grade level
    const borrowingLimit = getBorrowingLimit(args.gradeLevel);

    const now = Date.now();
    return await ctx.db.insert("students", {
      ...args,
      borrowingLimit,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update student
export const update = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    section: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    guardian: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    borrowingLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    // If grade level changed, update borrowing limit
    if (updates.gradeLevel !== undefined) {
      const newLimit = getBorrowingLimit(updates.gradeLevel);
      (filteredUpdates as any).borrowingLimit = newLimit;
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Block student
export const block = mutation({
  args: {
    id: v.id("students"),
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

// Unblock student
export const unblock = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    await ctx.db.patch(args.id, {
      isBlocked: false,
      blockReason: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete student (admin only)
export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin"]);

    // Check for active loans
    const activeLoans = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q: any) => q.eq("studentId", args.id))
      .filter((q: any) => q.eq(q.field("isReturned"), false))
      .first();

    if (activeLoans) {
      throw new Error("Cannot delete student with active loans");
    }

    await ctx.db.delete(args.id);
  },
});

// Help function to get borrowing limit (exported for use in bulkCreate)
function getBorrowingLimit(gradeLevel: number): number {
  if (gradeLevel >= 1 && gradeLevel <= 3) return 1;
  if (gradeLevel >= 4 && gradeLevel <= 6) return 2;
  if (gradeLevel >= 7 && gradeLevel <= 10) return 5;
  if (gradeLevel >= 11 && gradeLevel <= 12) return 7;
  return 3; // Default
}

// Bulk create students (for CSV import)
export const bulkCreate = mutation({
  args: {
    students: v.array(
      v.object({
        studentId: v.string(),
        name: v.string(),
        gradeLevel: v.number(),
        section: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        guardian: v.optional(v.string()),
        guardianPhone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx, ["admin", "staff"]);

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const now = Date.now();

    for (const student of args.students) {
      // Check for duplicate student ID
      const existing = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q: any) => q.eq("studentId", student.studentId))
        .first();

      if (existing) {
        results.skipped++;
        results.errors.push(`Duplicate: ${student.studentId}`);
        continue;
      }

      try {
        const borrowingLimit = getBorrowingLimit(student.gradeLevel);
        await ctx.db.insert("students", {
          ...student,
          borrowingLimit,
          isBlocked: false,
          createdAt: now,
          updatedAt: now,
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`${student.studentId}: ${error.message}`);
      }
    }

    return results;
  },
});

// Check for duplicate student IDs
export const checkDuplicates = query({
  args: { studentIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireLibrarian(ctx);

    const duplicates: string[] = [];

    for (const sId of args.studentIds) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q: any) => q.eq("studentId", sId))
        .first();

      if (existing) {
        duplicates.push(sId);
      }
    }

    return duplicates;
  },
});

// Get student statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireLibrarian(ctx);

    const allStudents = await ctx.db.query("students").collect();
    const blockedStudents = allStudents.filter((s: any) => s.isBlocked);

    // Group by grade level
    const gradeDistribution: Record<number, number> = {};
    for (const student of allStudents) {
      gradeDistribution[student.gradeLevel] =
        (gradeDistribution[student.gradeLevel] || 0) + 1;
    }

    return {
      total: allStudents.length,
      blocked: blockedStudents.length,
      active: allStudents.length - blockedStudents.length,
      gradeDistribution,
    };
  },
});
