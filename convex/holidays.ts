import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper to check if user is admin librarian
async function requireAdmin(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const librarian = await ctx.db
    .query("librarians")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!librarian || !librarian.isActive || librarian.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return librarian;
}

// List all holidays
export const list = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let holidays = await ctx.db
      .query("holidays")
      .withIndex("by_date")
      .order("asc")
      .collect();

    if (args.year) {
      const startOfYear = new Date(args.year, 0, 1).getTime();
      const endOfYear = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();

      holidays = holidays.filter(
        (h: any) => h.date >= startOfYear && h.date <= endOfYear
      );
    }

    return holidays;
  },
});

// Add a holiday
export const add = mutation({
  args: {
    date: v.number(),
    name: v.string(),
    type: v.union(
      v.literal("national"),
      v.literal("school"),
      v.literal("special")
    ),
    isRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Normalize to start of day
    const dateObj = new Date(args.date);
    dateObj.setHours(0, 0, 0, 0);

    return await ctx.db.insert("holidays", {
      date: dateObj.getTime(),
      name: args.name,
      type: args.type,
      isRecurring: args.isRecurring ?? false,
    });
  },
});

// Remove a holiday
export const remove = mutation({
  args: { id: v.id("holidays") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

// Initialize Philippine school year holidays for a given year
export const initializePhilippineHolidays = mutation({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const year = args.year;

    // Philippine Regular Holidays
    const regularHolidays = [
      { month: 0, day: 1, name: "New Year's Day" },
      { month: 3, day: 9, name: "Araw ng Kagitingan" },
      { month: 4, day: 1, name: "Labor Day" },
      { month: 5, day: 12, name: "Independence Day" },
      { month: 7, day: 21, name: "Ninoy Aquino Day" },
      { month: 7, day: 26, name: "National Heroes Day" },
      { month: 10, day: 30, name: "Bonifacio Day" },
      { month: 11, day: 25, name: "Christmas Day" },
      { month: 11, day: 30, name: "Rizal Day" },
    ];

    // Special Non-Working Days
    const specialHolidays = [
      { month: 1, day: 25, name: "EDSA People Power Revolution Anniversary" },
      { month: 7, day: 21, name: "Ninoy Aquino Day" },
      { month: 10, day: 1, name: "All Saints' Day" },
      { month: 10, day: 2, name: "All Souls' Day" },
      { month: 11, day: 8, name: "Feast of the Immaculate Conception" },
      { month: 11, day: 24, name: "Christmas Eve" },
      { month: 11, day: 31, name: "New Year's Eve" },
    ];

    // School-specific breaks
    const schoolHolidays = [
      // Semester break (typically October)
      { month: 9, day: 14, name: "Semestral Break" },
      { month: 9, day: 15, name: "Semestral Break" },
      { month: 9, day: 16, name: "Semestral Break" },
      { month: 9, day: 17, name: "Semestral Break" },
      { month: 9, day: 18, name: "Semestral Break" },
      // Christmas break
      { month: 11, day: 22, name: "Christmas Break" },
      { month: 11, day: 23, name: "Christmas Break" },
      { month: 11, day: 26, name: "Christmas Break" },
      { month: 11, day: 27, name: "Christmas Break" },
      { month: 11, day: 28, name: "Christmas Break" },
      { month: 11, day: 29, name: "Christmas Break" },
    ];

    // Insert holidays
    for (const holiday of regularHolidays) {
      const date = new Date(year, holiday.month, holiday.day);
      date.setHours(0, 0, 0, 0);

      // Check if already exists
      const existing = await ctx.db
        .query("holidays")
        .withIndex("by_date", (q: any) => q.eq("date", date.getTime()))
        .first();

      if (!existing) {
        await ctx.db.insert("holidays", {
          date: date.getTime(),
          name: holiday.name,
          type: "national",
          isRecurring: true,
        });
      }
    }

    for (const holiday of specialHolidays) {
      const date = new Date(year, holiday.month, holiday.day);
      date.setHours(0, 0, 0, 0);

      const existing = await ctx.db
        .query("holidays")
        .withIndex("by_date", (q: any) => q.eq("date", date.getTime()))
        .first();

      if (!existing) {
        await ctx.db.insert("holidays", {
          date: date.getTime(),
          name: holiday.name,
          type: "special",
          isRecurring: true,
        });
      }
    }

    for (const holiday of schoolHolidays) {
      const date = new Date(year, holiday.month, holiday.day);
      date.setHours(0, 0, 0, 0);

      const existing = await ctx.db
        .query("holidays")
        .withIndex("by_date", (q: any) => q.eq("date", date.getTime()))
        .first();

      if (!existing) {
        await ctx.db.insert("holidays", {
          date: date.getTime(),
          name: holiday.name,
          type: "school",
          isRecurring: false,
        });
      }
    }

    return { initialized: true, year };
  },
});

// Check if a date is a holiday
export const isHoliday = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    // Normalize to start of day
    const dateObj = new Date(args.date);
    dateObj.setHours(0, 0, 0, 0);

    const holiday = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q: any) => q.eq("date", dateObj.getTime()))
      .first();

    return holiday !== null;
  },
});
