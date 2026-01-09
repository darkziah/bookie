import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get the current user from auth
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Get the current librarian based on authenticated user
export const getCurrentLibrarian = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const librarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return librarian;
  },
});

// Check if the system requires initial setup (no librarians exist)
export const requiresSetup = query({
  args: {},
  handler: async (ctx) => {
    const librarian = await ctx.db.query("librarians").first();
    return !librarian;
  },
});

// Get all librarians (admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db
      .query("librarians")
      .order("desc")
      .collect();
  },
});

// Create a new librarian (admin only)
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("student_assistant")
    ),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if librarian already exists for this user
    const existing = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("Librarian already exists for this user");
    }

    return await ctx.db.insert("librarians", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Update librarian (admin only)
export const update = mutation({
  args: {
    id: v.id("librarians"),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("staff"),
        v.literal("student_assistant")
      )
    ),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

// Deactivate librarian (admin only)
export const deactivate = mutation({
  args: { id: v.id("librarians") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deactivation
    const target = await ctx.db.get(args.id);
    if (target?.userId === userId) {
      throw new Error("Cannot deactivate your own account");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});

// Activate librarian (admin only)
export const activate = mutation({
  args: { id: v.id("librarians") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.id, { isActive: true });
  },
});

// Remove librarian permanently (admin only)
export const remove = mutation({
  args: { id: v.id("librarians") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deletion
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("Librarian not found");
    }
    if (target.userId === userId) {
      throw new Error("Cannot delete your own account");
    }

    await ctx.db.delete(args.id);
  },
});

// Get single librarian by ID (admin only)
export const getById = query({
  args: { id: v.id("librarians") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db.get(args.id);
  },
});

// Update own profile (any authenticated librarian)
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian) {
      throw new Error("Librarian profile not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.employeeId !== undefined) updates.employeeId = args.employeeId;
    if (args.phone !== undefined) updates.phone = args.phone;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(currentLibrarian._id, updates);
    }

    return await ctx.db.get(currentLibrarian._id);
  },
});

// Setup first admin (only works when no librarians exist)
export const setupFirstAdmin = mutation({
  args: {
    name: v.string(),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if any librarians exist
    const existingLibrarians = await ctx.db.query("librarians").first();
    if (existingLibrarians) {
      throw new Error("Admin already exists. Use invite system.");
    }

    return await ctx.db.insert("librarians", {
      userId,
      name: args.name,
      role: "admin",
      employeeId: args.employeeId,
      phone: args.phone,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// ============================================
// INVITE MANAGEMENT (Admin only)
// ============================================

// Create an invite for a new member
export const createInvite = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("student_assistant")
    ),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Normalize email to lowercase
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if invite already exists for this email
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvite) {
      throw new Error("An invite already exists for this email");
    }

    // Check if a librarian already exists with this email (via users table)
    // Note: We'll check during accept instead since we don't have direct email access here

    return await ctx.db.insert("invites", {
      email: normalizedEmail,
      name: args.name,
      role: args.role,
      employeeId: args.employeeId,
      phone: args.phone,
      invitedBy: currentLibrarian._id,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// List all invites (admin only)
export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invites = await ctx.db
      .query("invites")
      .order("desc")
      .collect();

    // Enrich with inviter info
    const enrichedInvites = await Promise.all(
      invites.map(async (invite) => {
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          ...invite,
          inviterName: inviter?.name || "Unknown",
        };
      })
    );

    return enrichedInvites;
  },
});

// Revoke an invite (admin only)
export const revokeInvite = mutation({
  args: { id: v.id("invites") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only revoke pending invites");
    }

    await ctx.db.patch(args.id, { status: "revoked" });
  },
});

// Delete an invite permanently (admin only)
export const deleteInvite = mutation({
  args: { id: v.id("invites") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.delete(args.id);
  },
});

// Check if current user has a pending invite (used during signup)
export const checkInvite = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!invite) return null;

    return {
      id: invite._id,
      name: invite.name,
      role: invite.role,
      email: invite.email,
    };
  },
});

// Accept invite and create librarian record (called after signup)
export const acceptInvite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedEmail = args.email.toLowerCase().trim();

    // Find the pending invite
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!invite) {
      throw new Error("No pending invite found for this email");
    }

    // Check if librarian already exists for this user
    const existingLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingLibrarian) {
      // Mark invite as accepted anyway
      await ctx.db.patch(invite._id, {
        status: "accepted",
        acceptedAt: Date.now(),
      });
      return existingLibrarian;
    }

    // Create librarian record
    const librarianId = await ctx.db.insert("librarians", {
      userId,
      name: invite.name,
      role: invite.role,
      employeeId: invite.employeeId,
      phone: invite.phone,
      isActive: true,
      createdAt: Date.now(),
    });

    // Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    return await ctx.db.get(librarianId);
  },
});

// Resend invite (update timestamp - admin only)
export const resendInvite = mutation({
  args: { id: v.id("invites") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentLibrarian = await ctx.db
      .query("librarians")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentLibrarian || currentLibrarian.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only resend pending invites");
    }

    // Update the invite timestamp (could also extend expiration here)
    await ctx.db.patch(args.id, { createdAt: Date.now() });

    return invite;
  },
});
