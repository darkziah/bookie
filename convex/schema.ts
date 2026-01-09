import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Librarians/Staff management
  librarians: defineTable({
    userId: v.id("users"),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("student_assistant")
    ),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),

  // Member invitations (invite-only system)
  invites: defineTable({
    email: v.string(), // Email of the invited user
    name: v.string(), // Name to use when creating librarian record
    role: v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("student_assistant")
    ),
    employeeId: v.optional(v.string()),
    phone: v.optional(v.string()),
    invitedBy: v.id("librarians"), // Admin who created the invite
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
    acceptedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),


  // Student patrons
  students: defineTable({
    studentId: v.string(), // Barcode-scannable ID
    name: v.string(),
    gradeLevel: v.number(),
    section: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    guardian: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    borrowingLimit: v.number(),
    isBlocked: v.boolean(),
    blockReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_grade", ["gradeLevel"])
    .index("by_blocked", ["isBlocked"])
    .searchIndex("search_name", { searchField: "name" }),

  // Book catalog
  books: defineTable({
    isbn: v.optional(v.string()),
    accessionNumber: v.string(), // Unique identifier for each copy
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
    location: v.string(), // Shelf/section location
    status: v.union(
      v.literal("available"),
      v.literal("borrowed"),
      v.literal("reserved"),
      v.literal("missing"),
      v.literal("damaged"),
      v.literal("weeded")
    ),
    summary: v.optional(v.string()),
    marcData: v.optional(v.string()), // JSON string of MARC21 fields
    pages: v.optional(v.number()),
    language: v.optional(v.string()),
    lastBorrowedAt: v.optional(v.number()),
    lastInventoriedAt: v.optional(v.number()), // For inventory tracking
    inventoryNotes: v.optional(v.string()),
    totalBorrows: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_isbn", ["isbn"])
    .index("by_accession", ["accessionNumber"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_last_borrowed", ["lastBorrowedAt"])
    .searchIndex("search_title", { searchField: "title" })
    .searchIndex("search_author", { searchField: "author" }),

  // Circulation transactions
  transactions: defineTable({
    studentId: v.id("students"),
    bookId: v.id("books"),
    librarianId: v.optional(v.id("librarians")),
    checkoutDate: v.number(),
    dueDate: v.number(),
    returnDate: v.optional(v.number()),
    isReturned: v.boolean(),
    isOverdue: v.boolean(),
    renewalCount: v.number(),
    maxRenewals: v.number(),
    device: v.optional(v.string()), // "kiosk", "admin", etc.
    notes: v.optional(v.string()),
  })
    .index("by_student", ["studentId"])
    .index("by_book", ["bookId"])
    .index("by_returned", ["isReturned"])
    .index("by_overdue", ["isOverdue"])
    .index("by_checkout_date", ["checkoutDate"])
    .index("by_due_date", ["dueDate"]),

  // Philippine school holidays/closures
  holidays: defineTable({
    date: v.number(), // Unix timestamp (start of day)
    name: v.string(),
    type: v.union(
      v.literal("national"),
      v.literal("school"),
      v.literal("special")
    ),
    isRecurring: v.boolean(), // Recurs yearly
  }).index("by_date", ["date"]),

  // System settings (key-value store)
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Audit trail
  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    librarianId: v.optional(v.id("librarians")),
    action: v.string(), // "checkout", "checkin", "create_book", etc.
    entityType: v.string(), // "book", "student", "transaction"
    entityId: v.optional(v.string()),
    details: v.optional(v.string()), // JSON string with additional info
    ipAddress: v.optional(v.string()),
    device: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),

  // Inventory reports (for bulk scanning)
  inventoryReports: defineTable({
    name: v.string(),
    librarianId: v.id("librarians"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    totalScanned: v.number(),
    totalExpected: v.number(),
    missingCount: v.number(),
    misplacedCount: v.number(),
    overdueFoundCount: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_status", ["status"]),

  // Individual scan records for inventory
  inventoryScans: defineTable({
    reportId: v.id("inventoryReports"),
    bookId: v.id("books"),
    expectedLocation: v.string(),
    actualLocation: v.optional(v.string()),
    status: v.union(
      v.literal("found"),
      v.literal("missing"),
      v.literal("misplaced"),
      v.literal("overdue_found")
    ),
    scannedAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_book", ["bookId"]),
});
