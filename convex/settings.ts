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

// Get all settings
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const settings = await ctx.db.query("settings").collect();

    // Convert to key-value object
    const settingsMap: Record<string, any> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return settingsMap;
  },
});

// Get a specific setting
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    return setting?.value ?? null;
  },
});

// Set a setting (admin only)
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description ?? existing.description,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        description: args.description,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a setting (admin only)
export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Initialize default settings (called once during setup)
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const defaults = [
      {
        key: "borrowingDays",
        value: 14,
        description: "Default number of borrowing days",
      },
      {
        key: "maxRenewals",
        value: 2,
        description: "Maximum number of renewals allowed",
      },
      {
        key: "borrowingLimits",
        value: {
          "1-3": 1,
          "4-6": 2,
          "7-10": 5,
          "11-12": 7,
        },
        description: "Borrowing limits by grade level range",
      },
      {
        key: "overdueGracePeriod",
        value: 0,
        description: "Grace period days before marking as overdue",
      },
      {
        key: "schoolName",
        value: "School Library",
        description: "Name of the school",
      },
      {
        key: "libraryName",
        value: "Library Management System",
        description: "Name of the library",
      },
      {
        key: "currency",
        value: "PHP",
        description: "Currency for financial tracking",
      },
      {
        key: "kioskTimeout",
        value: 30,
        description: "Kiosk auto-logout timeout in seconds",
      },
      {
        key: "accessionPrefix",
        value: "B",
        description: "Prefix for auto-generated accession numbers",
      },
    ];

    for (const setting of defaults) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q: any) => q.eq("key", setting.key))
        .first();

      if (!existing) {
        await ctx.db.insert("settings", {
          ...setting,
          updatedAt: Date.now(),
        });
      }
    }

    return { initialized: true };
  },
});
