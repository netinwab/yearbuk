var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { fromPath } from "pdf2pic";
import * as fsSync from "fs";
import { drizzle as drizzle2 } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLogs: () => adminLogs,
  alumniBadges: () => alumniBadges,
  alumniRequestBlocks: () => alumniRequestBlocks,
  alumniRequests: () => alumniRequests,
  cartItems: () => cartItems,
  insertAdminLogSchema: () => insertAdminLogSchema,
  insertAlumniBadgeSchema: () => insertAlumniBadgeSchema,
  insertAlumniRequestBlockSchema: () => insertAlumniRequestBlockSchema,
  insertAlumniRequestSchema: () => insertAlumniRequestSchema,
  insertCartItemSchema: () => insertCartItemSchema,
  insertLoginActivitySchema: () => insertLoginActivitySchema,
  insertMemorySchema: () => insertMemorySchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPaymentRecordSchema: () => insertPaymentRecordSchema,
  insertPublicUploadLinkSchema: () => insertPublicUploadLinkSchema,
  insertSchoolGalleryImageSchema: () => insertSchoolGalleryImageSchema,
  insertSchoolSchema: () => insertSchoolSchema,
  insertTableOfContentsSchema: () => insertTableOfContentsSchema,
  insertUserSchema: () => insertUserSchema,
  insertViewerYearPurchaseSchema: () => insertViewerYearPurchaseSchema,
  insertYearPurchaseSchema: () => insertYearPurchaseSchema,
  insertYearbookCodeSchema: () => insertYearbookCodeSchema,
  insertYearbookPageSchema: () => insertYearbookPageSchema,
  insertYearbookPriceHistorySchema: () => insertYearbookPriceHistorySchema,
  insertYearbookSchema: () => insertYearbookSchema,
  loginActivity: () => loginActivity,
  memories: () => memories,
  notifications: () => notifications,
  paymentRecords: () => paymentRecords,
  publicUploadLinks: () => publicUploadLinks,
  schoolGalleryImages: () => schoolGalleryImages,
  schools: () => schools,
  tableOfContents: () => tableOfContents,
  users: () => users,
  viewerYearPurchases: () => viewerYearPurchases,
  yearPurchases: () => yearPurchases,
  yearbookCodes: () => yearbookCodes,
  yearbookPages: () => yearbookPages,
  yearbookPriceHistory: () => yearbookPriceHistory,
  yearbooks: () => yearbooks
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, boolean, date, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// shared/constants.ts
var CURRENT_YEAR = 2026;
var VIEWER_YEAR_PRICE = 6.99;

// shared/schema.ts
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(),
  // 'viewer', 'school', 'super_admin'
  role: text("role").notNull().default("viewer"),
  // 'viewer', 'super_admin' - used for access control
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  // Optional
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(),
  // Computed from firstName + middleName + lastName
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  // Format: (country code)(number)
  showPhoneToAlumni: boolean("show_phone_to_alumni").default(true),
  // Privacy setting for phone visibility
  preferredCurrency: text("preferred_currency").default("USD"),
  // User's preferred currency: USD or NGN
  profileImage: text("profile_image"),
  schoolId: varchar("school_id").references(() => schools.id),
  // For school admin users
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiresAt: timestamp("email_verification_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  country: text("country").notNull(),
  state: text("state"),
  city: text("city").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  // School phone number
  website: text("website"),
  // School website (optional)
  yearFounded: integer("year_founded").notNull(),
  registrationNumber: text("registration_number"),
  // School registration/license number
  accreditationDocument: text("accreditation_document"),
  // Path to uploaded accreditation document
  logo: text("logo"),
  // Path to uploaded school logo (1:1 aspect ratio)
  approvalStatus: text("approval_status").notNull().default("pending"),
  // 'pending', 'approved', 'rejected'
  activationCode: varchar("activation_code", { length: 12 }),
  // Alphanumeric code for approved schools
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  tempAdminCredentials: json("temp_admin_credentials"),
  // Temporary storage for admin credentials until approval
  // Paystack revenue sharing fields
  paystackSubaccountCode: text("paystack_subaccount_code"),
  // Paystack subaccount code for revenue sharing
  bankAccountNumber: text("bank_account_number"),
  // School's bank account number
  bankCode: text("bank_code"),
  // Bank code for the school's account
  subaccountStatus: text("subaccount_status").default("pending"),
  // 'pending', 'active', 'failed'
  revenueSharePercentage: integer("revenue_share_percentage").default(80),
  // School's share percentage (default 80%)
  createdAt: timestamp("created_at").defaultNow()
});
var alumniRequests = pgTable("alumni_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  fullName: text("full_name").notNull(),
  admissionYear: text("admission_year").notNull(),
  graduationYear: text("graduation_year").notNull(),
  postHeld: text("post_held"),
  studentName: text("student_name"),
  studentAdmissionYear: text("student_admission_year"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"),
  // 'pending', 'approved', 'denied'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var yearbooks = pgTable("yearbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  isPublished: boolean("is_published").default(false),
  isInitialized: boolean("is_initialized").default(false),
  frontCoverUrl: text("front_cover_url"),
  backCoverUrl: text("back_cover_url"),
  orientation: text("orientation"),
  // 'portrait', 'landscape', null (not selected)
  uploadType: text("upload_type"),
  // 'image', 'pdf', null (not selected)
  price: text("price"),
  // School-set price, min: $1.99, max: $49.99 (must be set by school before publishing)
  lastPriceIncrease: timestamp("last_price_increase"),
  // Track when price was last increased (for 30-day cooldown)
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at")
});
var yearbookPriceHistory = pgTable("yearbook_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearbookId: varchar("yearbook_id").references(() => yearbooks.id).notNull(),
  oldPrice: text("old_price").notNull(),
  newPrice: text("new_price").notNull(),
  changedBy: varchar("changed_by").references(() => users.id).notNull(),
  changedAt: timestamp("changed_at").defaultNow()
});
var yearbookPages = pgTable("yearbook_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearbookId: varchar("yearbook_id").references(() => yearbooks.id).notNull(),
  pageNumber: integer("page_number").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  pageType: text("page_type").notNull(),
  // 'front_cover', 'back_cover', 'content'
  createdAt: timestamp("created_at").defaultNow()
});
var tableOfContents = pgTable("table_of_contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearbookId: varchar("yearbook_id").references(() => yearbooks.id).notNull(),
  title: text("title").notNull(),
  pageNumber: integer("page_number").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var alumniBadges = pgTable("alumni_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  school: text("school").notNull(),
  // name of the school
  fullName: text("full_name").notNull(),
  // full name of the alumni
  graduationYear: text("graduation_year").notNull(),
  admissionYear: text("admission_year").notNull(),
  status: text("status").notNull().default("pending"),
  // 'verified', 'pending'
  createdAt: timestamp("created_at").defaultNow()
});
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  // 'alumni_approved', 'alumni_denied', 'yearbook_purchase', 'upload_approved', 'system_announcement'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"),
  // ID of related entity (alumni request, yearbook purchase, upload, etc.)
  createdAt: timestamp("created_at").defaultNow()
});
var yearPurchases = pgTable("year_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  // e.g., 2024
  purchased: boolean("purchased").default(false),
  purchaseDate: timestamp("purchase_date"),
  price: text("price"),
  // "14.99" or "0.00" for free
  paymentReference: text("payment_reference"),
  // Reference to payment record
  unlockedByAdmin: boolean("unlocked_by_admin").default(false),
  // True if unlocked by admin, false if purchased
  createdAt: timestamp("created_at").defaultNow()
});
var viewerYearPurchases = pgTable("viewer_year_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  purchased: boolean("purchased").default(false),
  purchaseDate: timestamp("purchase_date"),
  price: text("price").default(VIEWER_YEAR_PRICE.toString()),
  paymentReference: text("payment_reference"),
  // Reference to payment record
  createdAt: timestamp("created_at").defaultNow()
});
var cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  price: text("price").default(VIEWER_YEAR_PRICE.toString()),
  orientation: text("orientation"),
  // 'portrait', 'landscape' - configured before adding to cart
  uploadType: text("upload_type"),
  // 'image', 'pdf' - configured before adding to cart
  addedAt: timestamp("added_at").defaultNow()
});
var publicUploadLinks = pgTable("public_upload_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  category: text("category").notNull(),
  // 'graduation', 'sports', 'arts', 'field_trips', 'academic'
  linkCode: varchar("link_code", { length: 19 }).notNull().unique(),
  // Plain text format: XXXX-XXXX-XXXX-XXXX (visible to school only)
  hashedCode: text("hashed_code").notNull(),
  // Bcrypt hash for secure verification
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  maxUploads: integer("max_uploads").default(50),
  // Limit uploads per link
  currentUploads: integer("current_uploads").default(0),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  // Only 'image' supported
  eventDate: text("event_date").notNull(),
  year: integer("year").notNull(),
  // Changed from academicYear to year
  category: text("category"),
  // 'graduation', 'sports', 'arts', 'field_trips', 'academic'
  tags: json("tags").$type(),
  status: text("status").notNull().default("approved"),
  // 'pending', 'approved', 'rejected'
  uploadedBy: text("uploaded_by"),
  // For guest uploads - name of person who uploaded
  publicUploadLinkId: varchar("public_upload_link_id").references(() => publicUploadLinks.id),
  // Link to public upload if applicable
  createdAt: timestamp("created_at").defaultNow()
});
var alumniRequestBlocks = pgTable("alumni_request_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  blockedUntil: timestamp("blocked_until").notNull(),
  reason: text("reason").notNull(),
  // 'badge_deleted'
  createdAt: timestamp("created_at").defaultNow()
});
var adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  // 'deleted_school', 'approved_alumni', 'blocked_user', etc.
  targetType: text("target_type").notNull(),
  // 'user', 'school', 'alumni_badge'
  targetId: varchar("target_id").notNull(),
  // ID of the affected entity
  details: json("details").$type(),
  // Additional action details
  createdAt: timestamp("created_at").defaultNow()
});
var paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(),
  email: text("email").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  // Amount in kobo (smallest currency unit)
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"),
  // 'pending', 'success', 'failed'
  cartItems: text("cart_items").notNull(),
  // JSON string of cart items
  paystackData: text("paystack_data"),
  // JSON string of Paystack response data
  // Revenue sharing fields
  schoolId: varchar("school_id").references(() => schools.id),
  // School involved in the transaction
  splitCode: text("split_code"),
  // Paystack split code used for revenue sharing
  platformAmount: bigint("platform_amount", { mode: "number" }),
  // Platform's share in kobo
  schoolAmount: bigint("school_amount", { mode: "number" }),
  // School's share in kobo
  splitStatus: text("split_status").default("pending"),
  // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var yearbookCodes = pgTable("yearbook_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  year: integer("year").notNull(),
  // Academic year this code unlocks
  code: varchar("code", { length: 14 }).notNull().unique(),
  // 12-digit code in XXXX-XXXX-XXXX format
  isUsed: boolean("is_used").default(false),
  usedBy: varchar("used_by").references(() => users.id),
  // User who redeemed the code
  usedAt: timestamp("used_at"),
  // When the code was redeemed
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  fullName: true,
  // This will be computed from firstName + middleName + lastName
  isEmailVerified: true,
  // Set programmatically
  emailVerificationToken: true
  // Set programmatically
}).extend({
  phoneNumber: z.string().regex(/^\([1-9]\d{0,3}\)\d{4,15}$/, "Phone number must be in format (country code)(number)").optional()
});
var insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true
});
var insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true
}).extend({
  category: z.enum(["graduation", "sports", "arts", "field_trips", "academic"]).optional(),
  mediaType: z.literal("image")
});
var insertAlumniRequestSchema = createInsertSchema(alumniRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true
});
var insertAlumniBadgeSchema = createInsertSchema(alumniBadges).omit({
  id: true,
  createdAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});
var insertYearPurchaseSchema = createInsertSchema(yearPurchases).omit({
  id: true,
  createdAt: true
});
var insertViewerYearPurchaseSchema = createInsertSchema(viewerYearPurchases).omit({
  id: true,
  createdAt: true
});
var insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true
});
var insertAlumniRequestBlockSchema = createInsertSchema(alumniRequestBlocks).omit({
  id: true,
  createdAt: true
});
var insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true
});
var insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertYearbookCodeSchema = createInsertSchema(yearbookCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true
});
var insertPublicUploadLinkSchema = createInsertSchema(publicUploadLinks).omit({
  id: true,
  createdAt: true,
  currentUploads: true
}).extend({
  category: z.enum(["graduation", "sports", "arts", "field_trips", "academic"]),
  expiresAt: z.date()
});
var insertYearbookSchema = createInsertSchema(yearbooks).omit({
  id: true,
  createdAt: true,
  publishedAt: true
});
var insertYearbookPageSchema = createInsertSchema(yearbookPages).omit({
  id: true,
  createdAt: true
});
var insertYearbookPriceHistorySchema = createInsertSchema(yearbookPriceHistory).omit({
  id: true,
  changedAt: true
});
var insertTableOfContentsSchema = createInsertSchema(tableOfContents).omit({
  id: true,
  createdAt: true
});
var schoolGalleryImages = pgTable("school_gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").references(() => schools.id).notNull(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  // For ordering images in gallery
  isActive: boolean("is_active").default(true),
  // Allow hiding images without deleting
  createdAt: timestamp("created_at").defaultNow()
});
var insertSchoolGalleryImageSchema = createInsertSchema(schoolGalleryImages).omit({
  id: true,
  createdAt: true
});
var loginActivity = pgTable("login_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // Browser and OS information
  deviceType: text("device_type"),
  // 'desktop', 'mobile', 'tablet'
  browser: text("browser"),
  // Browser name
  os: text("os"),
  // Operating system
  city: text("city"),
  // Approximate location city
  region: text("region"),
  // State/region
  country: text("country"),
  // Country
  loginStatus: text("login_status").notNull().default("success"),
  // 'success', 'failed'
  failureReason: text("failure_reason"),
  // Reason for failed login
  createdAt: timestamp("created_at").defaultNow()
});
var insertLoginActivitySchema = createInsertSchema(loginActivity).omit({
  id: true,
  createdAt: true
});

// server/storage.ts
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, or, sql as sql2, isNotNull, desc } from "drizzle-orm";

// server/password-utils.ts
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();
var SALT_ROUNDS = 12;
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
async function hashUploadCode(code) {
  return await bcrypt.hash(code, SALT_ROUNDS);
}
async function verifyUploadCode(plainCode, hashedCode) {
  try {
    return await bcrypt.compare(plainCode, hashedCode);
  } catch (error) {
    console.error("Upload code verification error:", error);
    return false;
  }
}

// server/storage.ts
var connectionString = process.env.DATABASE_URL;
var client = new pg.Client({ connectionString });
await client.connect();
var db = drizzle(client);
var MemStorage = class {
  users;
  schools;
  memories;
  alumniBadges;
  alumniRequests;
  notifications;
  yearPurchases;
  viewerYearPurchases;
  cartItems;
  alumniRequestBlocks;
  yearbooks;
  yearbookPages;
  tableOfContents;
  yearbookCodes;
  publicUploadLinks;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.schools = /* @__PURE__ */ new Map();
    this.memories = /* @__PURE__ */ new Map();
    this.alumniBadges = /* @__PURE__ */ new Map();
    this.alumniRequests = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
    this.yearPurchases = /* @__PURE__ */ new Map();
    this.viewerYearPurchases = /* @__PURE__ */ new Map();
    this.cartItems = /* @__PURE__ */ new Map();
    this.alumniRequestBlocks = /* @__PURE__ */ new Map();
    this.yearbooks = /* @__PURE__ */ new Map();
    this.yearbookPages = /* @__PURE__ */ new Map();
    this.tableOfContents = /* @__PURE__ */ new Map();
    this.yearbookCodes = /* @__PURE__ */ new Map();
    this.publicUploadLinks = /* @__PURE__ */ new Map();
    this.initializeSeedData();
  }
  async initializeSeedData() {
    console.log("Database initialized successfully");
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserWithPassword(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email && user.email.toLowerCase() === email.toLowerCase()
    );
  }
  // Helper function to normalize phone numbers for comparison
  normalizePhoneNumber(phone) {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith("0") && cleaned.length >= 10) {
      cleaned = "234" + cleaned.substring(1);
    } else if (/^[789]/.test(cleaned) && cleaned.length >= 9 && cleaned.length <= 10) {
      cleaned = "234" + cleaned;
    }
    return cleaned;
  }
  async getUserByPhoneNumber(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return Array.from(this.users.values()).find(
      (user) => {
        if (!user.phoneNumber) return false;
        const userNormalizedPhone = this.normalizePhoneNumber(user.phoneNumber);
        return userNormalizedPhone === normalizedPhone;
      }
    );
  }
  async validateUser(username, password) {
    const user = Array.from(this.users.values()).find(
      (user2) => user2.username === username && user2.password === password
    );
    return user;
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const fullName = [insertUser.firstName, insertUser.middleName, insertUser.lastName].filter(Boolean).join(" ");
    const user = {
      ...insertUser,
      fullName,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      email: insertUser.email ?? null,
      profileImage: insertUser.profileImage ?? null,
      schoolId: insertUser.schoolId ?? null,
      middleName: insertUser.middleName ?? null,
      phoneNumber: insertUser.phoneNumber ?? null
    };
    this.users.set(id, user);
    return user;
  }
  async getSchools() {
    return Array.from(this.schools.values());
  }
  async getApprovedSchools() {
    return Array.from(this.schools.values()).filter(
      (school) => school.approvalStatus === "approved"
    );
  }
  async getSchool(id) {
    return this.schools.get(id);
  }
  async createSchool(insertSchool) {
    const id = randomUUID();
    const school = {
      ...insertSchool,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      address: insertSchool.address ?? null,
      state: insertSchool.state ?? null
    };
    this.schools.set(id, school);
    return school;
  }
  async getSchoolByAdminUserId(userId) {
    const user = this.users.get(userId);
    if (!user || user.userType !== "school") {
      return void 0;
    }
    if (user.schoolId) {
      return this.schools.get(user.schoolId);
    }
    const username = user.username.toLowerCase();
    const schools2 = Array.from(this.schools.values());
    for (const school of schools2) {
      const schoolName = school.name.toLowerCase();
      if (username.includes("frfr") && schoolName.includes("frfr")) {
        return school;
      }
      if (username.includes("admin") && schoolName.includes("test")) {
        return school;
      }
      if (username.includes("albesta") && schoolName.includes("albesta")) {
        return school;
      }
    }
    return Array.from(this.schools.values())[0];
  }
  async getSchoolByActivationCode(activationCode) {
    return Array.from(this.schools.values()).find(
      (school) => school.activationCode === activationCode
    );
  }
  async getSchoolAdminUser(schoolId) {
    return Array.from(this.users.values()).find(
      (user) => user.schoolId === schoolId && (user.userType === "school" || user.userType === "school_admin")
    );
  }
  async getPendingSchools() {
    return Array.from(this.schools.values()).filter(
      (school) => school.approvalStatus === "pending"
    );
  }
  async approveSchool(schoolId, approvedBy, activationCode) {
    const school = this.schools.get(schoolId);
    if (!school) {
      return void 0;
    }
    const updatedSchool = {
      ...school,
      approvalStatus: "approved",
      activationCode,
      approvedBy,
      approvedAt: /* @__PURE__ */ new Date()
    };
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }
  async rejectSchool(schoolId, rejectedBy, reason) {
    const school = this.schools.get(schoolId);
    if (!school) {
      return void 0;
    }
    const updatedSchool = {
      ...school,
      approvalStatus: "rejected",
      approvedBy: rejectedBy,
      approvedAt: /* @__PURE__ */ new Date(),
      rejectionReason: reason
    };
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }
  async updateSchoolProfile(schoolId, updates) {
    const school = this.schools.get(schoolId);
    if (!school) {
      return void 0;
    }
    const updatedSchool = {
      ...school,
      ...updates
    };
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }
  async updateSchoolLogo(schoolId, logoPath) {
    const school = this.schools.get(schoolId);
    if (!school) {
      return void 0;
    }
    const updatedSchool = {
      ...school,
      logo: logoPath
    };
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }
  async getMemoriesBySchoolAndYear(schoolId, year) {
    return Array.from(this.memories.values()).filter(
      (memory) => memory.schoolId === schoolId && memory.year === year
    );
  }
  async createMemory(insertMemory) {
    const id = randomUUID();
    const memory = {
      ...insertMemory,
      id,
      tags: insertMemory.tags ?? [],
      description: insertMemory.description ?? null,
      category: insertMemory.category ?? null,
      imageUrl: insertMemory.imageUrl ?? null,
      videoUrl: insertMemory.videoUrl ?? null,
      status: insertMemory.status ?? "pending",
      uploadedBy: insertMemory.uploadedBy ?? null,
      publicUploadLinkId: insertMemory.publicUploadLinkId ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.memories.set(id, memory);
    return memory;
  }
  async getPendingMemoriesBySchool(schoolId) {
    return Array.from(this.memories.values()).filter(
      (memory) => memory.schoolId === schoolId && memory.status === "pending"
    );
  }
  async getMemoryById(memoryId) {
    return this.memories.get(memoryId);
  }
  async approveMemory(memoryId, approvedBy) {
    const memory = this.memories.get(memoryId);
    if (memory) {
      const updatedMemory = {
        ...memory,
        status: "approved",
        approvedBy,
        approvedAt: /* @__PURE__ */ new Date()
      };
      this.memories.set(memoryId, updatedMemory);
      return updatedMemory;
    }
    return void 0;
  }
  async deleteMemory(memoryId) {
    return this.memories.delete(memoryId);
  }
  // Year purchase operations
  async getYearPurchasesBySchool(schoolId) {
    return Array.from(this.yearPurchases.values()).filter(
      (purchase) => purchase.schoolId === schoolId
    );
  }
  async createYearPurchase(insertPurchase) {
    const id = randomUUID();
    const purchase = {
      ...insertPurchase,
      id,
      purchased: insertPurchase.purchased ?? false,
      createdAt: /* @__PURE__ */ new Date(),
      purchaseDate: insertPurchase.purchaseDate ? new Date(insertPurchase.purchaseDate) : null,
      price: insertPurchase.price ?? null,
      paymentReference: insertPurchase.paymentReference ?? null
    };
    this.yearPurchases.set(id, purchase);
    return purchase;
  }
  async updateYearPurchase(purchaseId, purchased, unlockedByAdmin) {
    const purchase = this.yearPurchases.get(purchaseId);
    if (!purchase) return void 0;
    const updatedPurchase = {
      ...purchase,
      purchased,
      purchaseDate: purchased ? /* @__PURE__ */ new Date() : null,
      unlockedByAdmin: unlockedByAdmin ?? purchase.unlockedByAdmin ?? false
    };
    this.yearPurchases.set(purchaseId, updatedPurchase);
    return updatedPurchase;
  }
  // Viewer year purchase operations
  async getViewerYearPurchases(userId, schoolId) {
    return Array.from(this.viewerYearPurchases.values()).filter(
      (purchase) => purchase.userId === userId && purchase.schoolId === schoolId
    );
  }
  async getAllViewerYearPurchases(userId) {
    const purchases = Array.from(this.viewerYearPurchases.values()).filter(
      (purchase) => purchase.userId === userId && purchase.purchased === true
    );
    const purchasesWithSchoolInfo = await Promise.all(
      purchases.map(async (purchase) => {
        const school = this.schools.get(purchase.schoolId);
        return {
          ...purchase,
          school: school || null
        };
      })
    );
    return purchasesWithSchoolInfo;
  }
  async createViewerYearPurchase(insertPurchase) {
    const id = randomUUID();
    const purchase = {
      ...insertPurchase,
      id,
      purchased: insertPurchase.purchased ?? false,
      createdAt: /* @__PURE__ */ new Date(),
      purchaseDate: insertPurchase.purchaseDate ?? null,
      price: insertPurchase.price ?? "4.99",
      paymentReference: insertPurchase.paymentReference ?? null
    };
    this.viewerYearPurchases.set(id, purchase);
    return purchase;
  }
  async updateViewerYearPurchase(purchaseId, purchased) {
    const purchase = this.viewerYearPurchases.get(purchaseId);
    if (!purchase) return void 0;
    const updatedPurchase = {
      ...purchase,
      purchased,
      purchaseDate: purchased ? /* @__PURE__ */ new Date() : null
    };
    this.viewerYearPurchases.set(purchaseId, updatedPurchase);
    return updatedPurchase;
  }
  // Cart operations
  async getCartItems(userId) {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  async addCartItem(insertCartItem) {
    const id = randomUUID();
    const cartItem = {
      ...insertCartItem,
      id,
      price: insertCartItem.price ?? "4.99",
      addedAt: /* @__PURE__ */ new Date()
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  async removeCartItem(cartItemId) {
    return this.cartItems.delete(cartItemId);
  }
  async clearCart(userId) {
    const userCartItems = Array.from(this.cartItems.entries()).filter(
      ([, item]) => item.userId === userId
    );
    for (const [cartItemId] of userCartItems) {
      this.cartItems.delete(cartItemId);
    }
    return true;
  }
  // Additional required methods for MemStorage
  async getSchoolById(schoolId) {
    return this.schools.get(schoolId);
  }
  async updateSchoolSubaccount(schoolId, subaccountCode, bankAccountNumber, bankCode, status) {
    const school = this.schools.get(schoolId);
    if (!school) return void 0;
    const updatedSchool = {
      ...school,
      paystackSubaccountCode: subaccountCode,
      bankAccountNumber,
      bankCode,
      subaccountStatus: status
    };
    this.schools.set(schoolId, updatedSchool);
    return updatedSchool;
  }
  async deleteCartItemsBySchoolAndYear(schoolId, year) {
    const itemsToDelete = Array.from(this.cartItems.entries()).filter(
      ([, item]) => item.schoolId === schoolId && item.year === year
    );
    for (const [cartItemId] of itemsToDelete) {
      this.cartItems.delete(cartItemId);
    }
    return itemsToDelete.length;
  }
  async getCartItem(userId, schoolId, year) {
    return Array.from(this.cartItems.values()).find(
      (item) => item.userId === userId && item.schoolId === schoolId && item.year === year
    );
  }
  // Alumni request blocking
  async createAlumniRequestBlock(insertBlock) {
    const id = randomUUID();
    const block = {
      ...insertBlock,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.alumniRequestBlocks.set(id, block);
    return block;
  }
  async getAlumniRequestBlocks(userId, schoolId) {
    return Array.from(this.alumniRequestBlocks.values()).filter(
      (block) => block.userId === userId && block.schoolId === schoolId && /* @__PURE__ */ new Date() < new Date(block.blockedUntil)
    );
  }
  // Alumni request rate limiting
  async getAlumniRequestsInLastWeek(userId) {
    const oneWeekAgo = /* @__PURE__ */ new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return Array.from(this.alumniRequests.values()).filter(
      (request) => request.userId === userId && new Date(request.createdAt || "") >= oneWeekAgo
    );
  }
  async hasExistingAlumniRequest(userId, schoolId) {
    return Array.from(this.alumniRequests.values()).some(
      (request) => request.userId === userId && request.schoolId === schoolId && request.status === "pending"
    );
  }
  async getAlumniBadgesByUser(userId) {
    return Array.from(this.alumniBadges.values()).filter(
      (badge) => badge.userId === userId
    );
  }
  async getAlumniBadgesBySchool(schoolId) {
    const school = this.schools.get(schoolId);
    if (!school) return [];
    return Array.from(this.alumniBadges.values()).filter(
      (badge) => badge.school === school.name
    );
  }
  async createAlumniBadge(insertBadge) {
    const id = randomUUID();
    const badge = {
      ...insertBadge,
      id,
      fullName: insertBadge.fullName || "Unknown User",
      // Use provided fullName or fallback
      createdAt: /* @__PURE__ */ new Date()
    };
    this.alumniBadges.set(id, badge);
    return badge;
  }
  async updateAlumniBadgeStatus(badgeId, status) {
    const badge = this.alumniBadges.get(badgeId);
    if (!badge) return void 0;
    const updatedBadge = { ...badge, status };
    this.alumniBadges.set(badgeId, updatedBadge);
    return updatedBadge;
  }
  async deleteAlumniBadge(badgeId) {
    return this.alumniBadges.delete(badgeId);
  }
  async getAlumniRequestsBySchool(schoolId) {
    return Array.from(this.alumniRequests.values()).filter(
      (request) => request.schoolId === schoolId
    );
  }
  async getAlumniRequestById(requestId) {
    return this.alumniRequests.get(requestId);
  }
  async getAlumniRequest(requestId) {
    return this.alumniRequests.get(requestId);
  }
  async updateAlumniRequest(id, updates) {
    const existing = this.alumniRequests.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.alumniRequests.set(id, updated);
    return updated;
  }
  async deleteAlumniRequest(id) {
    return this.alumniRequests.delete(id);
  }
  async getAlumniRequests() {
    return Array.from(this.alumniRequests.values());
  }
  async getAlumniBadges() {
    return Array.from(this.alumniBadges.values());
  }
  async getYearbookPages(yearbookId) {
    return Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbookId
    ).sort((a, b) => a.pageNumber - b.pageNumber);
  }
  async updateYearbookPage(id, updates) {
    const existing = this.yearbookPages.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.yearbookPages.set(id, updated);
    return updated;
  }
  async updateYearbookPageOrder(pageId, newPageNumber) {
    const page = this.yearbookPages.get(pageId);
    if (!page) return void 0;
    const updatedPage = { ...page, pageNumber: newPageNumber };
    this.yearbookPages.set(pageId, updatedPage);
    return updatedPage;
  }
  async createAlumniRequest(insertRequest) {
    const id = randomUUID();
    const request = {
      ...insertRequest,
      id,
      status: insertRequest.status || "pending",
      reviewedBy: insertRequest.reviewedBy || null,
      reviewedAt: null,
      reviewNotes: insertRequest.reviewNotes || null,
      postHeld: insertRequest.postHeld || null,
      studentName: insertRequest.studentName || null,
      studentAdmissionYear: insertRequest.studentAdmissionYear || null,
      additionalInfo: insertRequest.additionalInfo || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.alumniRequests.set(id, request);
    return request;
  }
  async updateAlumniRequestStatus(requestId, status, reviewedBy, reviewNotes) {
    const request = this.alumniRequests.get(requestId);
    if (!request) return void 0;
    const updatedRequest = {
      ...request,
      status,
      reviewedBy,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewNotes: reviewNotes || null
    };
    this.alumniRequests.set(requestId, updatedRequest);
    return updatedRequest;
  }
  async getNotificationsByUser(userId) {
    return Array.from(this.notifications.values()).filter((notification) => notification.userId === userId).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  async createNotification(insertNotification) {
    const id = randomUUID();
    const notification = {
      ...insertNotification,
      id,
      isRead: insertNotification.isRead ?? false,
      relatedId: insertNotification.relatedId ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  async markNotificationAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;
    const updatedNotification = {
      ...notification,
      isRead: true
    };
    this.notifications.set(notificationId, updatedNotification);
    return true;
  }
  async deleteNotification(notificationId) {
    return this.notifications.delete(notificationId);
  }
  async clearAllNotifications(userId) {
    const userNotifications = Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId
    );
    userNotifications.forEach((notification) => {
      this.notifications.delete(notification.id);
    });
    return userNotifications.length;
  }
  async deleteOldNotifications(daysOld) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const oldNotifications = Array.from(this.notifications.values()).filter(
      (notification) => {
        const createdAt = notification.createdAt;
        return createdAt && createdAt < cutoffDate;
      }
    );
    oldNotifications.forEach((notification) => {
      this.notifications.delete(notification.id);
    });
    return oldNotifications.length;
  }
  // Student operations (for Alumni Tab - returns verified alumni as "students")
  async createStudent(student) {
    const id = randomUUID();
    const newStudent = {
      id,
      ...student,
      profileImage: student.profileImage || null,
      admissionYear: student.admissionYear || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.students.set(id, newStudent);
    return newStudent;
  }
  // Yearbook operations
  async getYearbook(schoolId, year) {
    const yearbook = Array.from(this.yearbooks.values()).find(
      (yb) => yb.schoolId === schoolId && yb.year === year
    );
    if (!yearbook) return void 0;
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    const tableOfContents2 = Array.from(this.tableOfContents.values()).filter(
      (item) => item.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    return {
      ...yearbook,
      pages,
      tableOfContents: tableOfContents2
    };
  }
  async getPublishedYearbook(schoolId, year) {
    const yearbook = Array.from(this.yearbooks.values()).find(
      (yb) => yb.schoolId === schoolId && yb.year === year && yb.isPublished === true
    );
    if (!yearbook) return void 0;
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    const tableOfContents2 = Array.from(this.tableOfContents.values()).filter(
      (item) => item.yearbookId === yearbook.id
    ).sort((a, b) => a.pageNumber - b.pageNumber);
    return {
      ...yearbook,
      pages,
      tableOfContents: tableOfContents2
    };
  }
  async createYearbook(insertYearbook) {
    const id = randomUUID();
    const yearbook = {
      ...insertYearbook,
      id,
      isPublished: insertYearbook.isPublished ?? false,
      isInitialized: insertYearbook.isInitialized ?? false,
      frontCoverUrl: insertYearbook.frontCoverUrl || null,
      backCoverUrl: insertYearbook.backCoverUrl || null,
      orientation: insertYearbook.orientation ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      publishedAt: null
    };
    this.yearbooks.set(id, yearbook);
    return yearbook;
  }
  async updateYearbookPublishStatus(yearbookId, isPublished) {
    const yearbook = this.yearbooks.get(yearbookId);
    if (!yearbook) return void 0;
    const updatedYearbook = {
      ...yearbook,
      isPublished,
      publishedAt: isPublished ? /* @__PURE__ */ new Date() : null
    };
    this.yearbooks.set(yearbookId, updatedYearbook);
    return updatedYearbook;
  }
  async updateYearbookCovers(yearbookId, frontCoverUrl, backCoverUrl) {
    const yearbook = this.yearbooks.get(yearbookId);
    if (!yearbook) return void 0;
    const updatedYearbook = {
      ...yearbook,
      frontCoverUrl,
      backCoverUrl
    };
    this.yearbooks.set(yearbookId, updatedYearbook);
    return updatedYearbook;
  }
  async createYearbookPage(insertPage) {
    const id = randomUUID();
    const page = {
      ...insertPage,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.yearbookPages.set(id, page);
    return page;
  }
  async deleteYearbookPage(pageId) {
    return this.yearbookPages.delete(pageId);
  }
  async getNextPageNumber(yearbookId) {
    const pages = Array.from(this.yearbookPages.values()).filter(
      (page) => page.yearbookId === yearbookId && page.pageType === "content"
    );
    return Math.max(...pages.map((p) => p.pageNumber), 0) + 1;
  }
  async createTableOfContentsItem(insertItem) {
    const id = randomUUID();
    const item = {
      ...insertItem,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      description: insertItem.description || null
    };
    this.tableOfContents.set(id, item);
    return item;
  }
  async updateTableOfContentsItem(tocId, updates) {
    const item = this.tableOfContents.get(tocId);
    if (!item) return void 0;
    const updatedItem = { ...item, ...updates };
    this.tableOfContents.set(tocId, updatedItem);
    return updatedItem;
  }
  async deleteTableOfContentsItem(tocId) {
    return this.tableOfContents.delete(tocId);
  }
  // Payment operations (MemStorage - for testing only)
  paymentRecords = /* @__PURE__ */ new Map();
  async createPaymentRecord(payment) {
    const id = randomUUID();
    const record = {
      ...payment,
      id,
      status: payment.status || "pending",
      schoolId: payment.schoolId || null,
      splitCode: payment.splitCode || null,
      platformAmount: payment.platformAmount || null,
      schoolAmount: payment.schoolAmount || null,
      splitStatus: payment.splitStatus || "pending",
      paystackData: payment.paystackData || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.paymentRecords.set(id, record);
    return record;
  }
  async getPaymentByReference(reference) {
    return Array.from(this.paymentRecords.values()).find((p) => p.reference === reference);
  }
  async updatePaymentStatus(reference, status) {
    const record = Array.from(this.paymentRecords.values()).find((p) => p.reference === reference);
    if (!record) return void 0;
    record.status = status;
    record.updatedAt = /* @__PURE__ */ new Date();
    this.paymentRecords.set(record.id, record);
    return record;
  }
  async getPaymentRecordsBySchool(schoolId) {
    return Array.from(this.paymentRecords.values()).filter((p) => p.schoolId === schoolId);
  }
  async clearUserCart(userId) {
    return this.clearCart(userId);
  }
  // Helper function to generate 12-digit yearbook code in XXXX-XXXX-XXXX format
  generateYearbookCode() {
    const part1 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    const part2 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    const part3 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    return `${part1}-${part2}-${part3}`;
  }
  // Yearbook code operations
  async createYearbookCodes(schoolId, year, count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      do {
        code = this.generateYearbookCode();
        attempts++;
        if (attempts > 100) throw new Error("Unable to generate unique code after 100 attempts");
      } while (Array.from(this.yearbookCodes.values()).some((c) => c.code === code));
      const id = randomUUID();
      const yearbookCode = {
        id,
        schoolId,
        year,
        code,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.yearbookCodes.set(id, yearbookCode);
      codes.push(yearbookCode);
    }
    return codes;
  }
  async redeemYearbookCode(code, userId) {
    const yearbookCode = Array.from(this.yearbookCodes.values()).find((c) => c.code === code);
    if (!yearbookCode) {
      return { success: false, message: "Invalid code" };
    }
    if (yearbookCode.isUsed) {
      return { success: false, message: "Code has already been used" };
    }
    const hasAccess = await this.checkUserYearbookAccess(userId, yearbookCode.schoolId, yearbookCode.year);
    if (hasAccess) {
      const school = await this.getSchool(yearbookCode.schoolId);
      return {
        success: false,
        message: `${yearbookCode.year} yearbook is already unlocked`
      };
    }
    yearbookCode.isUsed = true;
    yearbookCode.usedBy = userId;
    yearbookCode.usedAt = /* @__PURE__ */ new Date();
    this.yearbookCodes.set(yearbookCode.id, yearbookCode);
    await this.createViewerYearPurchase({
      userId,
      schoolId: yearbookCode.schoolId,
      year: yearbookCode.year,
      purchased: true,
      price: "0.00"
      // Free access via code
    });
    return { success: true, message: "Code redeemed successfully", year: yearbookCode.year };
  }
  async getYearbookCodesBySchool(schoolId) {
    return Array.from(this.yearbookCodes.values()).filter((c) => c.schoolId === schoolId);
  }
  async checkUserYearbookAccess(userId, schoolId, year) {
    const purchase = Array.from(this.viewerYearPurchases.values()).find(
      (p) => p.userId === userId && p.schoolId === schoolId && p.year === year && p.purchased
    );
    return !!purchase;
  }
  async deleteYearbookCode(codeId) {
    this.yearbookCodes.delete(codeId);
  }
  async deleteAllYearbookCodes(schoolId, year) {
    const codesToDelete = Array.from(this.yearbookCodes.values()).filter((c) => c.schoolId === schoolId && c.year === year);
    codesToDelete.forEach((code) => {
      this.yearbookCodes.delete(code.id);
    });
  }
  async getViewerPaymentHistory(userId) {
    const purchases = Array.from(this.viewerYearPurchases.values()).filter((p) => p.userId === userId && p.paymentReference);
    const purchasesWithSchool = await Promise.all(purchases.map(async (purchase) => {
      const school = await this.getSchool(purchase.schoolId);
      return {
        ...purchase,
        schoolName: school?.name || "Unknown School"
      };
    }));
    return purchasesWithSchool.sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }
  // Helper function to generate 16-character alphanumeric code in XXXX-XXXX-XXXX-XXXX format
  generatePublicUploadCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part3 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part4 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    return `${part1}-${part2}-${part3}-${part4}`;
  }
  // Public upload link operations
  async createPublicUploadLink(linkData) {
    const id = randomUUID();
    const plainCode = this.generatePublicUploadCode();
    const hashedCode = await hashUploadCode(plainCode);
    const publicUploadLink = {
      id,
      schoolId: linkData.schoolId,
      year: linkData.year,
      category: linkData.category,
      linkCode: plainCode,
      hashedCode,
      expiresAt: linkData.expiresAt,
      isActive: true,
      maxUploads: 50,
      currentUploads: 0,
      createdBy: linkData.createdBy,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.publicUploadLinks.set(id, publicUploadLink);
    return { linkCode: plainCode, id };
  }
  async getPublicUploadLinkByCode(linkCode) {
    const allLinks = Array.from(this.publicUploadLinks.values());
    for (const link of allLinks) {
      const isMatch = await verifyUploadCode(linkCode, link.hashedCode);
      if (isMatch) {
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > link.expiresAt;
        if (isExpired) {
          return void 0;
        }
        return {
          id: link.id,
          schoolId: link.schoolId,
          year: link.year,
          category: link.category,
          expiresAt: link.expiresAt,
          isActive: link.isActive || true,
          currentUploads: link.currentUploads || 0,
          maxUploads: link.maxUploads || 50
        };
      }
    }
    return void 0;
  }
  async getPublicUploadLinksBySchoolAndYear(schoolId, year) {
    return Array.from(this.publicUploadLinks.values()).filter(
      (link) => link.schoolId === schoolId && link.year === year
    );
  }
  async getPublicUploadLinkById(linkId) {
    return this.publicUploadLinks.get(linkId);
  }
  async updatePublicUploadLinkStatus(linkId, isActive) {
    const link = this.publicUploadLinks.get(linkId);
    if (!link) return void 0;
    const updatedLink = { ...link, isActive };
    this.publicUploadLinks.set(linkId, updatedLink);
    return updatedLink;
  }
  async deletePublicUploadLink(linkId) {
    return this.publicUploadLinks.delete(linkId);
  }
  async incrementUploadCount(linkId) {
    const link = this.publicUploadLinks.get(linkId);
    if (!link) return false;
    const updatedLink = { ...link, currentUploads: (link.currentUploads || 0) + 1 };
    this.publicUploadLinks.set(linkId, updatedLink);
    return true;
  }
  async updateMemoryStatus(memoryId, status) {
    const memory = this.memories.get(memoryId);
    if (!memory) return void 0;
    const updatedMemory = { ...memory, status };
    this.memories.set(memoryId, updatedMemory);
    return updatedMemory;
  }
  // Super Admin methods
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async getAllSchools() {
    return Array.from(this.schools.values());
  }
  async getAllAlumniBadges() {
    return Array.from(this.alumniBadges.values());
  }
  async getAllAlumniRequests() {
    return Array.from(this.alumniRequests.values());
  }
  // School gallery image operations (stub implementations - not used since we use DatabaseStorage)
  async getSchoolGalleryImages(schoolId) {
    return [];
  }
  async addSchoolGalleryImage(image) {
    const id = randomUUID();
    const galleryImage = {
      ...image,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      isActive: image.isActive ?? true,
      displayOrder: image.displayOrder ?? 0,
      title: image.title ?? null,
      description: image.description ?? null
    };
    return galleryImage;
  }
  async updateSchoolGalleryImage(imageId, schoolId, updates) {
    return void 0;
  }
  async deleteSchoolGalleryImage(imageId, schoolId) {
    return false;
  }
  async reorderSchoolGalleryImages(schoolId, imageOrders) {
    return true;
  }
};
var DatabaseStorage = class {
  // User operations - hybrid approach: try database first, then memory
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.getUser(id);
  }
  async getUserWithPassword(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.getUserWithPassword(id);
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.getUserByUsername(username.toLowerCase());
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.getUserByEmail(email.toLowerCase());
  }
  async getUserByVerificationToken(token) {
    const result = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
    return result[0];
  }
  // Helper function to normalize phone numbers for comparison (database version)
  normalizePhoneNumber(phone) {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith("0") && cleaned.length >= 10) {
      cleaned = "234" + cleaned.substring(1);
    } else if (/^[789]/.test(cleaned) && cleaned.length >= 9 && cleaned.length <= 10) {
      cleaned = "234" + cleaned;
    }
    return cleaned;
  }
  async getUserByPhoneNumber(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const allUsers = await db.select().from(users);
    const matchingUser = allUsers.find((user) => {
      if (!user.phoneNumber) return false;
      const userNormalizedPhone = this.normalizePhoneNumber(user.phoneNumber);
      return userNormalizedPhone === normalizedPhone;
    });
    if (matchingUser) return matchingUser;
    return this.memStorage.getUserByPhoneNumber(phoneNumber);
  }
  async validateUser(username, password) {
    const result = await db.select().from(users).where(
      and(eq(users.username, username), eq(users.password, password))
    ).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.validateUser(username, password);
  }
  async createUser(user) {
    const fullName = `${user.firstName}${user.middleName ? " " + user.middleName : ""} ${user.lastName}`;
    const newUser = { ...user, fullName };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  // School operations
  async getSchools() {
    return await db.select().from(schools);
  }
  async getApprovedSchools() {
    return await db.select().from(schools).where(eq(schools.approvalStatus, "approved"));
  }
  async getSchool(id) {
    const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
    return result[0];
  }
  async getSchoolByEmail(email) {
    const result = await db.select().from(schools).where(eq(schools.email, email)).limit(1);
    return result[0];
  }
  async getSchoolById(schoolId) {
    const result = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    return result[0];
  }
  async getSchoolByAdminUserId(userId) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]?.schoolId) return void 0;
    const result = await db.select().from(schools).where(eq(schools.id, user[0].schoolId)).limit(1);
    return result[0];
  }
  async createSchool(school) {
    const result = await db.insert(schools).values(school).returning();
    return result[0];
  }
  async updateSchoolProfile(schoolId, updates) {
    const result = await db.update(schools).set(updates).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }
  async updateSchoolLogo(schoolId, logoPath) {
    const result = await db.update(schools).set({ logo: logoPath }).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }
  async getSchoolByActivationCode(activationCode) {
    const result = await db.select().from(schools).where(eq(schools.activationCode, activationCode)).limit(1);
    return result[0];
  }
  async getSchoolAdminUser(schoolId) {
    const result = await db.select().from(users).where(
      and(
        eq(users.schoolId, schoolId),
        or(eq(users.userType, "school"), eq(users.userType, "school_admin"))
      )
    ).limit(1);
    return result[0];
  }
  async getPendingSchools() {
    return await db.select().from(schools).where(eq(schools.approvalStatus, "pending"));
  }
  async approveSchool(schoolId, approvedBy, activationCode) {
    const result = await db.update(schools).set({
      approvalStatus: "approved",
      activationCode,
      approvedBy,
      approvedAt: /* @__PURE__ */ new Date()
    }).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }
  async rejectSchool(schoolId, rejectedBy, reason) {
    const result = await db.update(schools).set({
      approvalStatus: "rejected",
      approvedBy: rejectedBy,
      approvedAt: /* @__PURE__ */ new Date(),
      rejectionReason: reason
    }).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }
  async updateSchoolSubaccount(schoolId, subaccountCode, bankAccountNumber, bankCode, status) {
    const result = await db.update(schools).set({
      paystackSubaccountCode: subaccountCode,
      bankAccountNumber,
      bankCode,
      subaccountStatus: status
    }).where(eq(schools.id, schoolId)).returning();
    return result[0];
  }
  async clearTempAdminCredentials(schoolId) {
    await db.update(schools).set({ tempAdminCredentials: null }).where(eq(schools.id, schoolId));
  }
  // Memory operations
  async getMemoriesBySchoolAndYear(schoolId, year) {
    return await db.select().from(memories).where(
      and(eq(memories.schoolId, schoolId), eq(memories.year, year))
    );
  }
  async createMemory(memory) {
    const result = await db.insert(memories).values(memory).returning();
    return result[0];
  }
  async getPendingMemoriesBySchool(schoolId) {
    try {
      const result = await db.execute(sql2`
        SELECT id, title, description, image_url, video_url, media_type, event_date, year, category, status, uploaded_by, created_at 
        FROM memories 
        WHERE school_id = ${schoolId} AND status = 'pending' 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error("Failed to get pending memories:", error);
      throw error;
    }
  }
  async getMemoryById(memoryId) {
    const result = await db.select().from(memories).where(eq(memories.id, memoryId)).limit(1);
    return result[0];
  }
  async approveMemory(memoryId, approvedBy) {
    const result = await db.update(memories).set({
      status: "approved"
    }).where(eq(memories.id, memoryId)).returning();
    return result[0];
  }
  async updateMemoryTitle(memoryId, title) {
    const result = await db.update(memories).set({ title }).where(eq(memories.id, memoryId)).returning();
    return result[0];
  }
  async deleteMemory(memoryId) {
    try {
      await db.delete(memories).where(eq(memories.id, memoryId));
      return true;
    } catch (error) {
      return false;
    }
  }
  // Year purchase operations
  async getYearPurchasesBySchool(schoolId) {
    return await db.select().from(yearPurchases).where(
      eq(yearPurchases.schoolId, schoolId)
    );
  }
  async createYearPurchase(purchase) {
    const result = await db.insert(yearPurchases).values(purchase).returning();
    return result[0];
  }
  async updateYearPurchase(purchaseId, purchased, unlockedByAdmin) {
    const updates = { purchased };
    if (purchased) {
      updates.purchaseDate = /* @__PURE__ */ new Date();
    }
    if (unlockedByAdmin !== void 0) {
      updates.unlockedByAdmin = unlockedByAdmin;
    }
    const result = await db.update(yearPurchases).set(updates).where(eq(yearPurchases.id, purchaseId)).returning();
    return result[0];
  }
  // Continue with other methods following the same pattern...
  // For brevity, I'll implement the key yearbook methods needed for the orientation feature
  // Yearbook operations
  async getYearbooksBySchool(schoolId) {
    return await db.select().from(yearbooks).where(eq(yearbooks.schoolId, schoolId));
  }
  async getYearbook(id) {
    const result = await db.select().from(yearbooks).where(eq(yearbooks.id, id)).limit(1);
    return result[0];
  }
  async getYearbookBySchoolAndYear(schoolId, year) {
    const result = await db.select().from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.year, year))
    ).limit(1);
    const yearbook = result[0];
    if (!yearbook) return void 0;
    const pages = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbook.id));
    const tocItems = await db.select().from(tableOfContents).where(eq(tableOfContents.yearbookId, yearbook.id));
    return {
      ...yearbook,
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
      tableOfContents: tocItems.sort((a, b) => a.pageNumber - b.pageNumber)
    };
  }
  async createYearbook(yearbook) {
    const result = await db.insert(yearbooks).values(yearbook).returning();
    return result[0];
  }
  async updateYearbook(id, updates) {
    const result = await db.update(yearbooks).set(updates).where(eq(yearbooks.id, id)).returning();
    return result[0];
  }
  async getPublishedYearbook(schoolId, year) {
    const result = await db.select().from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.year, year), eq(yearbooks.isPublished, true))
    ).limit(1);
    const yearbook = result[0];
    if (!yearbook) return void 0;
    const pages = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbook.id));
    const tocItems = await db.select().from(tableOfContents).where(eq(tableOfContents.yearbookId, yearbook.id));
    return {
      ...yearbook,
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
      tableOfContents: tocItems.sort((a, b) => a.pageNumber - b.pageNumber)
    };
  }
  async updateYearbookPublishStatus(yearbookId, isPublished) {
    const updates = { isPublished };
    if (isPublished) {
      updates.publishedAt = /* @__PURE__ */ new Date();
    }
    const result = await db.update(yearbooks).set(updates).where(eq(yearbooks.id, yearbookId)).returning();
    return result[0];
  }
  async updateYearbookCovers(yearbookId, frontCoverUrl, backCoverUrl) {
    const result = await db.update(yearbooks).set({ frontCoverUrl, backCoverUrl }).where(eq(yearbooks.id, yearbookId)).returning();
    return result[0];
  }
  async updateYearbookPrice(yearbookId, newPrice, changedBy) {
    const priceNum = parseFloat(newPrice);
    if (priceNum < 1.99 || priceNum > 49.99) {
      return {
        success: false,
        message: "Price must be between $1.99 and $49.99"
      };
    }
    const [yearbook] = await db.select().from(yearbooks).where(eq(yearbooks.id, yearbookId)).limit(1);
    if (!yearbook) {
      return { success: false, message: "Yearbook not found" };
    }
    const oldPrice = parseFloat(yearbook.price || "14.99");
    if (priceNum > oldPrice) {
      const canIncrease = await this.canIncreaseYearbookPrice(yearbookId);
      if (!canIncrease.canIncrease) {
        return {
          success: false,
          message: canIncrease.message || "You can only increase your yearbook price once every 30 days."
        };
      }
      await db.update(yearbooks).set({
        price: newPrice,
        lastPriceIncrease: /* @__PURE__ */ new Date()
      }).where(eq(yearbooks.id, yearbookId));
    } else {
      await db.update(yearbooks).set({ price: newPrice }).where(eq(yearbooks.id, yearbookId));
    }
    await db.insert(yearbookPriceHistory).values({
      yearbookId,
      oldPrice: yearbook.price || "14.99",
      newPrice,
      changedBy
    });
    await this.createNotification({
      userId: changedBy,
      type: "price_updated",
      title: "Yearbook Price Updated",
      message: `Yearbook "${yearbook.title}" price updated to $${newPrice}`,
      relatedId: yearbookId
    });
    const [updatedYearbook] = await db.select().from(yearbooks).where(eq(yearbooks.id, yearbookId)).limit(1);
    return {
      success: true,
      message: "Price updated successfully",
      yearbook: updatedYearbook
    };
  }
  async getYearbookPriceHistory(yearbookId) {
    return await db.select().from(yearbookPriceHistory).where(eq(yearbookPriceHistory.yearbookId, yearbookId)).orderBy(yearbookPriceHistory.changedAt);
  }
  async canIncreaseYearbookPrice(yearbookId) {
    const [yearbook] = await db.select().from(yearbooks).where(eq(yearbooks.id, yearbookId)).limit(1);
    if (!yearbook) {
      return { canIncrease: false, message: "Yearbook not found" };
    }
    if (!yearbook.lastPriceIncrease) {
      return { canIncrease: true };
    }
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(yearbook.lastPriceIncrease) > thirtyDaysAgo) {
      const nextAllowedDate = new Date(yearbook.lastPriceIncrease);
      nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
      return {
        canIncrease: false,
        message: `You can only increase your yearbook price once every 30 days. Next increase available on ${nextAllowedDate.toLocaleDateString()}.`
      };
    }
    return { canIncrease: true };
  }
  async getAllPublishedYearbooks(schoolId) {
    const result = await db.select({
      year: yearbooks.year,
      isPublished: yearbooks.isPublished,
      price: yearbooks.price
    }).from(yearbooks).where(
      and(eq(yearbooks.schoolId, schoolId), eq(yearbooks.isPublished, true))
    );
    return result.map((yearbook) => ({
      year: yearbook.year,
      isPublished: true,
      price: yearbook.price || "14.99"
    }));
  }
  // For the remaining methods, let's keep using MemStorage temporarily 
  // This is a hybrid approach until we fully migrate
  memStorage = new MemStorage();
  // Delegate remaining methods to MemStorage for now
  async getViewerYearPurchases(userId, schoolId) {
    const result = await db.select().from(viewerYearPurchases).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        eq(viewerYearPurchases.schoolId, schoolId)
      )
    );
    return result;
  }
  async getAllViewerYearPurchases(userId) {
    const purchases = await db.select().from(viewerYearPurchases).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        eq(viewerYearPurchases.purchased, true)
      )
    );
    const purchasesWithSchoolInfo = await Promise.all(
      purchases.map(async (purchase) => {
        const schoolResults = await db.select().from(schools).where(eq(schools.id, purchase.schoolId));
        const school = schoolResults[0] || null;
        return {
          ...purchase,
          school
        };
      })
    );
    return purchasesWithSchoolInfo;
  }
  async createViewerYearPurchase(purchase) {
    const result = await db.insert(viewerYearPurchases).values(purchase).returning();
    return result[0];
  }
  async updateViewerYearPurchase(purchaseId, purchased) {
    const result = await db.update(viewerYearPurchases).set({
      purchased,
      purchaseDate: purchased ? /* @__PURE__ */ new Date() : null
    }).where(eq(viewerYearPurchases.id, purchaseId)).returning();
    return result[0];
  }
  // Cart operations
  async getCartItems(userId) {
    const result = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    return result;
  }
  async addCartItem(cartItem) {
    const result = await db.insert(cartItems).values(cartItem).returning();
    return result[0];
  }
  async removeCartItem(cartItemId) {
    const result = await db.delete(cartItems).where(eq(cartItems.id, cartItemId)).returning();
    return result.length > 0;
  }
  async clearCart(userId) {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }
  async deleteCartItemsBySchoolAndYear(schoolId, year) {
    const result = await db.delete(cartItems).where(and(eq(cartItems.schoolId, schoolId), eq(cartItems.year, year))).returning();
    return result.length;
  }
  async getCartItem(userId, schoolId, year) {
    const result = await db.select().from(cartItems).where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.schoolId, schoolId),
        eq(cartItems.year, year)
      )
    ).limit(1);
    return result[0];
  }
  async createAlumniRequestBlock(block) {
    return this.memStorage.createAlumniRequestBlock(block);
  }
  async getAlumniRequestBlocks(userId, schoolId) {
    return this.memStorage.getAlumniRequestBlocks(userId, schoolId);
  }
  async getAlumniRequests() {
    return this.memStorage.getAlumniRequests();
  }
  async getYearbookPages(yearbookId) {
    const result = await db.select().from(yearbookPages).where(eq(yearbookPages.yearbookId, yearbookId));
    if (result.length > 0) {
      return result.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    return this.memStorage.getYearbookPages(yearbookId);
  }
  async updateYearbookPage(id, updates) {
    return this.memStorage.updateYearbookPage(id, updates);
  }
  async getAlumniRequestsBySchool(schoolId) {
    return this.memStorage.getAlumniRequestsBySchool(schoolId);
  }
  async getAlumniRequest(id) {
    return this.memStorage.getAlumniRequest(id);
  }
  async getAlumniRequestById(requestId) {
    return this.memStorage.getAlumniRequest(requestId);
  }
  async updateAlumniRequestStatus(requestId, status, reviewedBy, reviewNotes) {
    return this.memStorage.updateAlumniRequestStatus(requestId, status, reviewedBy, reviewNotes);
  }
  async hasExistingAlumniRequest(userId, schoolId) {
    return this.memStorage.hasExistingAlumniRequest(userId, schoolId);
  }
  async getAlumniRequestsInLastWeek(userId) {
    return this.memStorage.getAlumniRequestsInLastWeek(userId);
  }
  async createAlumniRequest(request) {
    return this.memStorage.createAlumniRequest(request);
  }
  async updateAlumniRequest(id, updates) {
    return this.memStorage.updateAlumniRequest(id, updates);
  }
  async deleteAlumniRequest(id) {
    return this.memStorage.deleteAlumniRequest(id);
  }
  async getAlumniBadges() {
    return await db.select().from(alumniBadges);
  }
  async getAlumniBadgesByUser(userId) {
    return await db.select().from(alumniBadges).where(eq(alumniBadges.userId, userId));
  }
  async getAlumniBadgesBySchool(schoolId) {
    const school = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    if (!school[0]) return [];
    const result = await db.select({
      id: alumniBadges.id,
      userId: alumniBadges.userId,
      school: alumniBadges.school,
      fullName: alumniBadges.fullName,
      graduationYear: alumniBadges.graduationYear,
      admissionYear: alumniBadges.admissionYear,
      status: alumniBadges.status,
      createdAt: alumniBadges.createdAt,
      email: users.email,
      phoneNumber: users.phoneNumber
    }).from(alumniBadges).innerJoin(users, eq(alumniBadges.userId, users.id)).where(eq(alumniBadges.school, school[0].name));
    return result;
  }
  async updateAlumniBadgeStatus(badgeId, status) {
    const result = await db.update(alumniBadges).set({ status }).where(eq(alumniBadges.id, badgeId)).returning();
    return result[0];
  }
  async createAlumniBadge(badge) {
    const result = await db.insert(alumniBadges).values(badge).returning();
    return result[0];
  }
  async deleteAlumniBadge(id) {
    const result = await db.delete(alumniBadges).where(eq(alumniBadges.id, id)).returning();
    return result.length > 0;
  }
  async getNotificationsByUser(userId) {
    return this.memStorage.getNotificationsByUser(userId);
  }
  async createNotification(notification) {
    return this.memStorage.createNotification(notification);
  }
  async markNotificationAsRead(id) {
    const result = await this.memStorage.markNotificationAsRead(id);
    return result !== void 0;
  }
  async deleteNotification(id) {
    return this.memStorage.deleteNotification(id);
  }
  async clearAllNotifications(userId) {
    return this.memStorage.clearAllNotifications(userId);
  }
  async deleteOldNotifications(daysOld) {
    return this.memStorage.deleteOldNotifications(daysOld);
  }
  async createYearbookPage(page) {
    const result = await db.insert(yearbookPages).values(page).returning();
    return result[0];
  }
  async getYearbookPageById(pageId) {
    const result = await db.select().from(yearbookPages).where(eq(yearbookPages.id, pageId)).limit(1);
    return result[0];
  }
  async deleteYearbookPage(pageId) {
    const result = await db.delete(yearbookPages).where(eq(yearbookPages.id, pageId)).returning();
    return result.length > 0;
  }
  async getNextPageNumber(yearbookId) {
    const pages = await db.select().from(yearbookPages).where(
      and(eq(yearbookPages.yearbookId, yearbookId), eq(yearbookPages.pageType, "content"))
    );
    const maxPageNumber = pages.length > 0 ? Math.max(...pages.map((p) => p.pageNumber)) : 0;
    return maxPageNumber + 1;
  }
  async updateYearbookPageOrder(pageId, newPageNumber) {
    const result = await db.update(yearbookPages).set({ pageNumber: newPageNumber }).where(eq(yearbookPages.id, pageId)).returning();
    return result[0];
  }
  async createTableOfContentsItem(insertItem) {
    const result = await db.insert(tableOfContents).values(insertItem).returning();
    return result[0];
  }
  async updateTableOfContentsItem(tocId, updates) {
    const result = await db.update(tableOfContents).set(updates).where(eq(tableOfContents.id, tocId)).returning();
    return result[0];
  }
  async deleteTableOfContentsItem(tocId) {
    const result = await db.delete(tableOfContents).where(eq(tableOfContents.id, tocId)).returning();
    return result.length > 0;
  }
  // Super Admin methods
  async getAllUsers() {
    return await db.select().from(users);
  }
  async getAllSchools() {
    return await db.select().from(schools);
  }
  async getAllAlumniBadges() {
    return await db.select().from(alumniBadges);
  }
  async getAllAlumniRequests() {
    return await db.select().from(alumniRequests);
  }
  async getUserById(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result[0]) return result[0];
    return this.memStorage.getUser(id);
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }
  async deleteSchool(id) {
    const result = await db.delete(schools).where(eq(schools.id, id)).returning();
    return Array.isArray(result) && result.length > 0;
  }
  async updateUserRole(id, userType) {
    const result = await db.update(users).set({ userType }).where(eq(users.id, id)).returning();
    return result[0];
  }
  async updateUserPrivacySettings(userId, updateData) {
    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result.length > 0 ? result[0] : void 0;
  }
  async updateUserProfile(userId, updateData) {
    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return result.length > 0 ? result[0] : void 0;
  }
  async logAdminAction(adminUserId, action, targetType, targetId, details) {
    await db.insert(adminLogs).values({
      adminUserId,
      action,
      targetType,
      targetId,
      details: details || {}
    });
  }
  async getAdminLogs() {
    return await db.select().from(adminLogs);
  }
  // Payment operations
  async createPaymentRecord(payment) {
    const result = await db.insert(paymentRecords).values(payment).returning();
    return result[0];
  }
  async getPaymentByReference(reference) {
    const result = await db.select().from(paymentRecords).where(eq(paymentRecords.reference, reference)).limit(1);
    return result[0];
  }
  async updatePaymentStatus(reference, status) {
    const result = await db.update(paymentRecords).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(paymentRecords.reference, reference)).returning();
    return result[0];
  }
  async getPaymentRecordsBySchool(schoolId) {
    return await db.select().from(paymentRecords).where(eq(paymentRecords.schoolId, schoolId));
  }
  async clearUserCart(userId) {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId)).returning();
    return result.length > 0;
  }
  // Helper function to generate 12-digit yearbook code in XXXX-XXXX-XXXX format
  generateYearbookCode() {
    const part1 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    const part2 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    const part3 = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    return `${part1}-${part2}-${part3}`;
  }
  // Yearbook code operations
  async createYearbookCodes(schoolId, year, count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      do {
        code = this.generateYearbookCode();
        attempts++;
        if (attempts > 100) throw new Error("Unable to generate unique code after 100 attempts");
        const existing = await db.select().from(yearbookCodes).where(eq(yearbookCodes.code, code)).limit(1);
        if (existing.length === 0) break;
      } while (true);
      const result = await db.insert(yearbookCodes).values({
        schoolId,
        year,
        code
      }).returning();
      codes.push(result[0]);
    }
    return codes;
  }
  async redeemYearbookCode(code, userId) {
    const result = await db.select().from(yearbookCodes).where(eq(yearbookCodes.code, code)).limit(1);
    const yearbookCode = result[0];
    if (!yearbookCode) {
      return { success: false, message: "Invalid code" };
    }
    if (yearbookCode.isUsed) {
      return { success: false, message: "Code has already been used" };
    }
    const hasAccess = await this.checkUserYearbookAccess(userId, yearbookCode.schoolId, yearbookCode.year);
    if (hasAccess) {
      return {
        success: false,
        message: `${yearbookCode.year} yearbook is already unlocked`
      };
    }
    await db.update(yearbookCodes).set({
      isUsed: true,
      usedBy: userId,
      usedAt: /* @__PURE__ */ new Date()
    }).where(eq(yearbookCodes.id, yearbookCode.id));
    await db.insert(viewerYearPurchases).values({
      userId,
      schoolId: yearbookCode.schoolId,
      year: yearbookCode.year,
      purchased: true,
      price: "0.00",
      // Free access via code
      purchaseDate: /* @__PURE__ */ new Date()
    });
    return { success: true, message: "Code redeemed successfully", year: yearbookCode.year };
  }
  async getYearbookCodesBySchool(schoolId) {
    return await db.select().from(yearbookCodes).where(eq(yearbookCodes.schoolId, schoolId));
  }
  async checkUserYearbookAccess(userId, schoolId, year) {
    const result = await db.select().from(viewerYearPurchases).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        eq(viewerYearPurchases.schoolId, schoolId),
        eq(viewerYearPurchases.year, year),
        eq(viewerYearPurchases.purchased, true)
      )
    ).limit(1);
    return result.length > 0;
  }
  async deleteYearbookCode(codeId) {
    await db.delete(yearbookCodes).where(eq(yearbookCodes.id, codeId));
  }
  async deleteAllYearbookCodes(schoolId, year) {
    await db.delete(yearbookCodes).where(
      and(
        eq(yearbookCodes.schoolId, schoolId),
        eq(yearbookCodes.year, year)
      )
    );
  }
  async getViewerPaymentHistory(userId) {
    const purchases = await db.select({
      purchase: viewerYearPurchases,
      schoolName: schools.name
    }).from(viewerYearPurchases).leftJoin(schools, eq(viewerYearPurchases.schoolId, schools.id)).where(
      and(
        eq(viewerYearPurchases.userId, userId),
        isNotNull(viewerYearPurchases.paymentReference)
      )
    ).orderBy(desc(viewerYearPurchases.purchaseDate));
    return purchases.map((p) => ({
      ...p.purchase,
      schoolName: p.schoolName || "Unknown School"
    }));
  }
  // Helper function to generate 16-character alphanumeric code in XXXX-XXXX-XXXX-XXXX format
  generatePublicUploadCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part3 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const part4 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    return `${part1}-${part2}-${part3}-${part4}`;
  }
  // Public upload link operations
  async createPublicUploadLink(linkData) {
    const plainCode = this.generatePublicUploadCode();
    const hashedCode = await hashUploadCode(plainCode);
    const result = await db.insert(publicUploadLinks).values({
      schoolId: linkData.schoolId,
      year: linkData.year,
      category: linkData.category,
      linkCode: plainCode,
      hashedCode,
      expiresAt: linkData.expiresAt,
      createdBy: linkData.createdBy
    }).returning();
    return { linkCode: plainCode, id: result[0].id };
  }
  async getPublicUploadLinkByCode(linkCode) {
    const allLinks = await db.select().from(publicUploadLinks);
    for (const link of allLinks) {
      const isMatch = await verifyUploadCode(linkCode, link.hashedCode);
      if (isMatch) {
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > link.expiresAt;
        if (isExpired) {
          return void 0;
        }
        return {
          id: link.id,
          schoolId: link.schoolId,
          year: link.year,
          category: link.category,
          expiresAt: link.expiresAt,
          isActive: link.isActive || true,
          currentUploads: link.currentUploads || 0,
          maxUploads: link.maxUploads || 50
        };
      }
    }
    return void 0;
  }
  async incrementUploadCount(linkId) {
    const result = await db.update(publicUploadLinks).set({ currentUploads: sql2`current_uploads + 1` }).where(eq(publicUploadLinks.id, linkId)).returning();
    return result.length > 0;
  }
  async updateMemoryStatus(memoryId, status) {
    const result = await db.update(memories).set({ status }).where(eq(memories.id, memoryId)).returning();
    return result[0];
  }
  async getPublicUploadLinksBySchoolAndYear(schoolId, year) {
    const result = await db.select().from(publicUploadLinks).where(
      and(
        eq(publicUploadLinks.schoolId, schoolId),
        eq(publicUploadLinks.year, year)
      )
    );
    return result;
  }
  async getPublicUploadLinkById(linkId) {
    const result = await db.select().from(publicUploadLinks).where(eq(publicUploadLinks.id, linkId)).limit(1);
    return result[0];
  }
  async updatePublicUploadLinkStatus(linkId, isActive) {
    const result = await db.update(publicUploadLinks).set({ isActive }).where(eq(publicUploadLinks.id, linkId)).returning();
    return result[0];
  }
  async deletePublicUploadLink(linkId) {
    const result = await db.delete(publicUploadLinks).where(eq(publicUploadLinks.id, linkId)).returning();
    return result.length > 0;
  }
  // School gallery image operations
  async getSchoolGalleryImages(schoolId) {
    const result = await db.select().from(schoolGalleryImages).where(and(
      eq(schoolGalleryImages.schoolId, schoolId),
      eq(schoolGalleryImages.isActive, true)
    )).orderBy(schoolGalleryImages.displayOrder);
    return result;
  }
  async addSchoolGalleryImage(image) {
    const result = await db.insert(schoolGalleryImages).values(image).returning();
    return result[0];
  }
  async updateSchoolGalleryImage(imageId, schoolId, updates) {
    const result = await db.update(schoolGalleryImages).set(updates).where(and(
      eq(schoolGalleryImages.id, imageId),
      eq(schoolGalleryImages.schoolId, schoolId)
    )).returning();
    return result[0];
  }
  async deleteSchoolGalleryImage(imageId, schoolId) {
    const result = await db.delete(schoolGalleryImages).where(and(
      eq(schoolGalleryImages.id, imageId),
      eq(schoolGalleryImages.schoolId, schoolId)
    )).returning();
    return result.length > 0;
  }
  async reorderSchoolGalleryImages(schoolId, imageOrders) {
    try {
      for (const { id, displayOrder } of imageOrders) {
        await db.update(schoolGalleryImages).set({ displayOrder }).where(and(
          eq(schoolGalleryImages.id, id),
          eq(schoolGalleryImages.schoolId, schoolId)
        ));
      }
      return true;
    } catch (error) {
      console.error("Error reordering school gallery images:", error);
      return false;
    }
  }
  // Login activity operations
  async createLoginActivity(activity) {
    const result = await db.insert(loginActivity).values(activity).returning();
    return result[0];
  }
  async getLoginActivitiesByUser(userId, limit = 10) {
    const result = await db.select().from(loginActivity).where(eq(loginActivity.userId, userId)).orderBy(sql2`${loginActivity.createdAt} DESC`).limit(limit);
    return result;
  }
  async getMostRecentLogin(userId) {
    const result = await db.select().from(loginActivity).where(eq(loginActivity.userId, userId)).orderBy(sql2`${loginActivity.createdAt} DESC`).limit(1);
    return result[0];
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import crypto from "crypto";

// server/utils/sendEmail.ts
import { Resend } from "resend";
var EMAIL_DISABLED = true;
function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error("Resend credentials not configured. Please set RESEND_API_KEY and RESEND_FROM_EMAIL environment variables.");
  }
  return { apiKey, fromEmail };
}
function getResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}
async function sendEmail(to, subject, htmlContent) {
  if (EMAIL_DISABLED) {
    console.log("\u{1F4E7} Email system temporarily disabled \u2014 would send:", {
      to,
      subject,
      emailType: subject.includes("Verify") ? "verification" : subject.includes("Password") ? "password_reset" : "notification"
    });
    return { success: true };
  }
  try {
    const { client: client2, fromEmail } = getResendClient();
    const result = await client2.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: htmlContent
    });
    console.log("\u2705 Email sent successfully:", {
      to,
      subject,
      emailId: result.data?.id
    });
    return { success: true };
  } catch (error) {
    console.error("\u274C Failed to send email:", {
      to,
      subject,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email"
    };
  }
}

// server/routes.ts
var connectionString2 = process.env.DATABASE_URL;
var queryClient = postgres(connectionString2);
var db2 = drizzle2(queryClient);
console.log(`Server startup: CURRENT_YEAR = ${CURRENT_YEAR}`);
var formatTitleCase = (text2) => {
  if (!text2 || typeof text2 !== "string") return text2;
  return text2.split(/(\s+|,\s*)/).map((part) => {
    if (/^\s*$/.test(part) || /^,\s*$/.test(part)) {
      return part;
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join("");
};
var reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Waibuk-App/1.0"
          // Required by Nominatim
        }
      }
    );
    if (!response.ok) {
      return { city: null, region: null, country: null };
    }
    const data = await response.json();
    const address = data.address || {};
    return {
      city: address.city || address.town || address.village || address.suburb || null,
      region: address.state || address.region || null,
      country: address.country || null
    };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return { city: null, region: null, country: null };
  }
};
var trackLoginActivity = async (req, userId, loginStatus, failureReason, geolocation) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "";
    let deviceType = "desktop";
    let browser = "Unknown";
    let os = "Unknown";
    if (userAgent) {
      if (/mobile/i.test(userAgent)) deviceType = "mobile";
      else if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";
      if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = "Chrome";
      else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
      else if (/firefox/i.test(userAgent)) browser = "Firefox";
      else if (/edg/i.test(userAgent)) browser = "Edge";
      else if (/opera|opr/i.test(userAgent)) browser = "Opera";
      if (/windows/i.test(userAgent)) os = "Windows";
      else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
      else if (/linux/i.test(userAgent)) os = "Linux";
      else if (/android/i.test(userAgent)) os = "Android";
      else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
    }
    let city = null;
    let region = null;
    let country = null;
    if (geolocation && geolocation.latitude && geolocation.longitude) {
      const location = await reverseGeocode(geolocation.latitude, geolocation.longitude);
      city = location.city;
      region = location.region;
      country = location.country;
    }
    await storage.createLoginActivity({
      userId,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      city,
      region,
      country,
      loginStatus,
      failureReason
    });
  } catch (error) {
    console.error("Error tracking login activity:", error);
  }
};
var ensureUploadDirs = async () => {
  const dirs = [
    "public/uploads/accreditation",
    "public/uploads/yearbooks",
    "public/uploads/profiles",
    "public/uploads/memories",
    "public/uploads/logos"
  ];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
    }
  }
};
var requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Super admin access denied" });
    }
    const userId = authHeader.substring(7);
    const user = await storage.getUserById(userId);
    if (!user || user.userType !== "super_admin" && user.role !== "super_admin") {
      return res.status(403).json({ message: "Super admin privileges required" });
    }
    req.superAdmin = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication" });
  }
};
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "accreditationDocument") {
      cb(null, "public/uploads/accreditation");
    } else if (file.fieldname === "memoryFile") {
      cb(null, "public/uploads/memories");
    } else if (file.fieldname === "galleryImage") {
      cb(null, "public/uploads/memories");
    } else if (file.fieldname === "schoolLogo") {
      cb(null, "public/uploads/logos");
    } else {
      cb(null, "public/uploads/yearbooks");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    if (file.fieldname === "accreditationDocument") {
      cb(null, `accreditation-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else if (file.fieldname === "memoryFile") {
      cb(null, `memory-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else if (file.fieldname === "galleryImage") {
      cb(null, `gallery-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else if (file.fieldname === "schoolLogo") {
      cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    } else {
      cb(null, `yearbook-page-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 20 * 1024 * 1024
    // 20MB limit for images and PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "schoolLogo") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("School logo must be an image file"));
      }
    } else if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  await ensureUploadDirs();
  async function getSimplePendingMemories(schoolId) {
    const pkg = await import("pg");
    const { Pool } = pkg.default;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const result = await pool.query(
        "SELECT id, title, description, image_url, media_type, event_date, year, category, status, uploaded_by, created_at FROM memories WHERE school_id = $1 AND status = $2 ORDER BY created_at DESC",
        [schoolId, "pending"]
      );
      await pool.end();
      return result.rows;
    } catch (error) {
      await pool.end();
      throw error;
    }
  }
  app2.get("/api/test-pending-memories/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const result = await getSimplePendingMemories(schoolId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Database error", details: error.message });
    }
  });
  app2.get("/api/debug-auth/:schoolId", async (req, res) => {
    console.log("=== DEBUG AUTH START ===");
    try {
      const { schoolId } = req.params;
      console.log("SchoolId:", schoolId);
      const authHeader = req.headers.authorization;
      console.log("Auth header:", authHeader);
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("AUTH FAIL: No Bearer token");
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      console.log("User ID:", userId);
      const user = await storage.getUser(userId);
      console.log("User found:", user);
      if (!user) {
        console.log("AUTH FAIL: User not found");
        return res.status(403).json({ message: "User not found" });
      }
      console.log("User type:", user.userType);
      console.log("AUTH SUCCESS!");
      res.json({ success: true, userId, userType: user.userType });
    } catch (error) {
      console.error("DEBUG AUTH ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, geolocation } = req.body;
      let user = await storage.getUserByUsername(username.toLowerCase());
      if (!user) {
        if (username.includes("@")) {
          user = await storage.getUserByEmail(username.toLowerCase());
        }
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        await trackLoginActivity(req, user.id, "failed", "Invalid password", geolocation);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.userType === "school" && user.schoolId) {
        const school = await storage.getSchoolById(user.schoolId);
        if (!school) {
          await trackLoginActivity(req, user.id, "failed", "School not found", geolocation);
          return res.status(401).json({ message: "School not found" });
        }
        if (school.approvalStatus !== "approved") {
          await trackLoginActivity(req, user.id, "failed", "School pending approval", geolocation);
          return res.status(403).json({
            message: "School account is pending approval. Please wait for super admin approval before logging in.",
            approvalStatus: school.approvalStatus
          });
        }
      }
      await trackLoginActivity(req, user.id, "success", void 0, geolocation);
      let redirectTo = "/viewer-dashboard";
      if (user.userType === "super_admin" || user.role === "super_admin") {
        redirectTo = "/super-admin";
      } else if (user.userType === "school") {
        redirectTo = "/school-dashboard";
      }
      const { password: _, ...userInfo } = user;
      res.json({ user: userInfo, redirectTo });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/verify-password", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.validateUser(username, password);
      if (user) {
        res.json({ verified: true });
      } else {
        res.json({ verified: false });
      }
    } catch (error) {
      console.error("Password verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, userType, firstName, middleName, lastName, dateOfBirth, email, phoneNumber } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required for account verification" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingUserWithEmail = await storage.getUserByEmail(email.toLowerCase());
      if (existingUserWithEmail) {
        return res.status(400).json({ message: "This email is already registered" });
      }
      if (phoneNumber && phoneNumber.trim() !== "") {
        const existingUserWithPhone = await storage.getUserByPhoneNumber(phoneNumber);
        if (existingUserWithPhone) {
          return res.status(400).json({ message: "This phone number is already registered with another account" });
        }
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: username.toLowerCase(),
        password: hashedPassword,
        userType,
        firstName: formatTitleCase(firstName),
        middleName: middleName ? formatTitleCase(middleName) : void 0,
        lastName: formatTitleCase(lastName),
        dateOfBirth,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || void 0,
        profileImage: void 0
      });
      await storage.updateUser(user.id, {
        isEmailVerified: true
      });
      const { password: _, emailVerificationToken: __, ...userInfo } = user;
      res.json({
        user: userInfo,
        message: "Account created successfully. You can now log in."
        // TEMPORARY: Changed message for disabled email verification
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });
  app2.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification link."
        });
      }
      if (user.emailVerificationTokenExpiresAt && /* @__PURE__ */ new Date() > user.emailVerificationTokenExpiresAt) {
        return res.status(400).json({
          success: false,
          message: "Verification link has expired. Please request a new one.",
          expired: true
        });
      }
      if (user.isEmailVerified) {
        return res.json({
          success: true,
          message: "Email already verified. You can now log in.",
          alreadyVerified: true
        });
      }
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null
      });
      res.json({
        success: true,
        message: "Email verified successfully! You can now log in."
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Verification failed. Please try again."
      });
    }
  });
  app2.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ message: "If an account exists with this email, a verification link has been sent." });
      }
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "This email is already verified. You can log in." });
      }
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = /* @__PURE__ */ new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: tokenExpiry
      });
      const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:5000";
      const verificationLink = `${baseUrl}/verify-email/${verificationToken}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F9CF9 0%, #14CF93 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: #4F9CF9; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Waibuk Account</h1>
            </div>
            <div class="content">
              <p>Hi ${user.firstName},</p>
              <p>We received a request to resend your email verification link. Please click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Waibuk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      await sendEmail(user.email, "Verify Your Waibuk Account", emailHtml);
      res.json({ message: "Verification email sent. Please check your inbox." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
  });
  app2.post("/api/auth/school-register", upload.single("accreditationDocument"), async (req, res) => {
    try {
      const { username, password, schoolName, country, state, city, email, phoneNumber, website, address, yearFounded, registrationNumber } = req.body;
      if (!phoneNumber) {
        console.error("ERROR: Phone number is missing or null in school registration:", {
          received: phoneNumber,
          type: typeof phoneNumber,
          allFields: Object.keys(req.body)
        });
      }
      if (!username || !password || !schoolName || !country || !city || !email || !phoneNumber || !yearFounded) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingSchool = await storage.getSchoolByEmail(email);
      if (existingSchool) {
        return res.status(400).json({ message: "A school registration with this email already exists" });
      }
      const hashedPassword = await hashPassword(password);
      let accreditationDocumentPath = null;
      if (req.file) {
        try {
          await fs.access(req.file.path);
          accreditationDocumentPath = req.file.path;
        } catch (err) {
          console.error("File upload failed:", err);
        }
      }
      const school = await storage.createSchool({
        name: formatTitleCase(schoolName),
        address: address ? formatTitleCase(address) : void 0,
        country,
        state: state || void 0,
        city: formatTitleCase(city),
        email,
        phoneNumber,
        // This maps to phone_number column in DB
        website: website || void 0,
        yearFounded: parseInt(yearFounded),
        registrationNumber: registrationNumber || void 0,
        accreditationDocument: accreditationDocumentPath || void 0,
        tempAdminCredentials: {
          username,
          password: hashedPassword,
          firstName: formatTitleCase(schoolName),
          lastName: ""
        }
      });
      res.json({
        school: {
          id: school.id,
          name: school.name,
          email: school.email,
          approvalStatus: school.approvalStatus
        },
        message: "School registration submitted for approval. No account has been created yet - please wait for super admin approval before attempting to log in."
      });
    } catch (error) {
      console.error("School registration error:", error);
      res.status(500).json({ message: "School registration failed" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.get("/api/schools", async (req, res) => {
    try {
      const schools2 = await storage.getApprovedSchools();
      res.json(schools2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get schools" });
    }
  });
  app2.get("/api/schools/:schoolId/gallery", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const images = await storage.getSchoolGalleryImages(schoolId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching school gallery images:", error);
      res.status(500).json({ message: "Failed to get gallery images" });
    }
  });
  app2.post("/api/schools/:schoolId/gallery", upload.single("galleryImage"), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const { title, description } = req.body;
      const existingImages = await storage.getSchoolGalleryImages(schoolId);
      const nextDisplayOrder = existingImages.length;
      const imageData = {
        schoolId,
        imageUrl: `/uploads/memories/${file.filename}`,
        // Now correctly matches upload destination
        title: title || null,
        description: description || null,
        displayOrder: nextDisplayOrder,
        isActive: true
      };
      const validatedData = insertSchoolGalleryImageSchema.parse(imageData);
      const galleryImage = await storage.addSchoolGalleryImage(validatedData);
      res.status(201).json({ ...galleryImage, message: "Gallery image uploaded successfully!" });
    } catch (error) {
      console.error("Error creating gallery image:", error);
      res.status(500).json({ message: "Failed to upload gallery image" });
    }
  });
  app2.patch("/api/schools/:schoolId/gallery/:imageId", async (req, res) => {
    try {
      const { schoolId, imageId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const allowedUpdates = ["title", "description", "displayOrder", "isActive"];
      const updates = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedUpdates.includes(key)) {
          updates[key] = value;
        }
      }
      const updatedImage = await storage.updateSchoolGalleryImage(imageId, schoolId, updates);
      if (!updatedImage) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });
  app2.delete("/api/schools/:schoolId/gallery/:imageId", async (req, res) => {
    try {
      const { schoolId, imageId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const success = await storage.deleteSchoolGalleryImage(imageId, schoolId);
      if (!success) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      res.json({ message: "Gallery image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });
  app2.post("/api/schools/:schoolId/gallery/reorder", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { imageOrders } = req.body;
      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({ message: "imageOrders must be an array" });
      }
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const success = await storage.reorderSchoolGalleryImages(schoolId, imageOrders);
      if (!success) {
        return res.status(500).json({ message: "Failed to reorder images" });
      }
      res.json({ message: "Gallery images reordered successfully" });
    } catch (error) {
      console.error("Error reordering gallery images:", error);
      res.status(500).json({ message: "Failed to reorder gallery images" });
    }
  });
  app2.get("/api/alumni-badges/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const badges = await storage.getAlumniBadgesByUser(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges:", error);
      res.status(500).json({ message: "Failed to get alumni badges" });
    }
  });
  app2.get("/api/alumni-badges/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const badges = await storage.getAlumniBadgesBySchool(schoolId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges by school:", error);
      res.status(500).json({ message: "Failed to get alumni badges" });
    }
  });
  app2.post("/api/alumni-badges", async (req, res) => {
    try {
      const { userId, school, admissionYear, graduationYear } = req.body;
      if (!userId || !school || !admissionYear || !graduationYear) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const badge = await storage.createAlumniBadge({
        userId,
        school,
        fullName: user.fullName,
        admissionYear,
        graduationYear,
        status: "pending"
      });
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating alumni badge:", error);
      res.status(500).json({ message: "Failed to create alumni badge request" });
    }
  });
  app2.delete("/api/alumni-badges/:badgeId", async (req, res) => {
    try {
      const { badgeId } = req.params;
      const badge = await storage.getAlumniBadgesByUser("");
      const badgeToDelete = Array.from(badge).find((b) => b.id === badgeId);
      const success = await storage.deleteAlumniBadge(badgeId);
      if (!success) {
        return res.status(404).json({ message: "Alumni badge not found" });
      }
      if (badgeToDelete) {
        const blockedUntil = /* @__PURE__ */ new Date();
        blockedUntil.setMonth(blockedUntil.getMonth() + 3);
        const schools2 = await storage.getSchools();
        const school = schools2.find((s) => s.name === badgeToDelete.school);
        if (school) {
          await storage.createAlumniRequestBlock({
            userId: badgeToDelete.userId,
            schoolId: school.id,
            blockedUntil,
            reason: "badge_deleted"
          });
        }
      }
      res.json({ message: "Alumni badge deleted successfully" });
    } catch (error) {
      console.error("Error deleting alumni badge:", error);
      res.status(500).json({ message: "Failed to delete alumni badge" });
    }
  });
  app2.get("/api/students/:schoolId/search", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      const badges = await storage.getAlumniBadgesBySchool(schoolId);
      const verifiedBadges = badges.filter((badge) => badge.status === "verified");
      const students = await Promise.all(verifiedBadges.map(async (badge) => {
        const user = await storage.getUserById(badge.userId);
        return {
          id: badge.userId,
          fullName: badge.fullName,
          graduationYear: badge.graduationYear,
          admissionYear: badge.admissionYear,
          school: badge.school,
          email: badge.email || user?.email,
          phoneNumber: badge.phoneNumber || user?.phoneNumber,
          showPhoneToAlumni: user?.showPhoneToAlumni
        };
      }));
      res.json(students);
    } catch (error) {
      console.error("Error fetching students by school:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.get("/api/students/:schoolId/:graduationYear", async (req, res) => {
    try {
      const { schoolId, graduationYear } = req.params;
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      const badges = await storage.getAlumniBadgesBySchool(schoolId);
      const verifiedBadges = badges.filter(
        (badge) => badge.status === "verified" && badge.graduationYear === graduationYear
      );
      const students = await Promise.all(verifiedBadges.map(async (badge) => {
        const user = await storage.getUserById(badge.userId);
        return {
          id: badge.userId,
          fullName: badge.fullName,
          graduationYear: badge.graduationYear,
          admissionYear: badge.admissionYear,
          school: badge.school,
          email: badge.email || user?.email,
          phoneNumber: badge.phoneNumber || user?.phoneNumber,
          showPhoneToAlumni: user?.showPhoneToAlumni
        };
      }));
      res.json(students);
    } catch (error) {
      console.error("Error fetching students by graduation year:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.get("/api/alumni-requests/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const requests = await storage.getAlumniRequestsBySchool(schoolId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching alumni requests:", error);
      res.status(500).json({ message: "Failed to get alumni requests" });
    }
  });
  app2.get("/api/alumni-requests/school/:schoolId/count", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const requests = await storage.getAlumniRequestsBySchool(schoolId);
      const pendingCount = requests.filter((r) => r.status === "pending").length;
      res.json({ pendingCount });
    } catch (error) {
      console.error("Error fetching alumni request count:", error);
      res.status(500).json({ message: "Failed to get alumni request count" });
    }
  });
  app2.post("/api/alumni-requests", async (req, res) => {
    try {
      const requestData = req.body;
      if (!requestData.userId || !requestData.schoolId || !requestData.fullName || !requestData.admissionYear || !requestData.graduationYear) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const hasExistingRequest = await storage.hasExistingAlumniRequest(requestData.userId, requestData.schoolId);
      if (hasExistingRequest) {
        return res.status(400).json({ message: "You already have a pending alumni request for this school" });
      }
      const blocks = await storage.getAlumniRequestBlocks(requestData.userId, requestData.schoolId);
      if (blocks.length > 0) {
        const latestBlock = blocks[0];
        return res.status(400).json({
          message: `You cannot make alumni requests to this school until ${new Date(latestBlock.blockedUntil).toLocaleDateString()}`
        });
      }
      const school = await storage.getSchool(requestData.schoolId);
      if (school) {
        const existingBadges = await storage.getAlumniBadgesByUser(requestData.userId);
        const duplicateSchoolBadge = existingBadges.find((badge) => badge.school === school.name);
        if (duplicateSchoolBadge) {
          return res.status(400).json({ message: `You already have an alumni badge for ${school.name}. You cannot have multiple badges from the same school.` });
        }
        if (existingBadges.length >= 4) {
          return res.status(400).json({ message: "You have reached the maximum number of alumni badges (4). Please upgrade your account to add more alumni statuses." });
        }
      }
      const recentRequests = await storage.getAlumniRequestsInLastWeek(requestData.userId);
      if (recentRequests.length >= 10) {
        return res.status(429).json({ message: "You've made too many requests, try again later" });
      }
      const request = await storage.createAlumniRequest(requestData);
      if (school?.adminUserId) {
        const user = await storage.getUser(requestData.userId);
        await storage.createNotification({
          userId: school.adminUserId,
          type: "alumni_request_new",
          title: "New Alumni Verification Request",
          message: `${user?.fullName || "A user"} has requested alumni verification for ${requestData.graduationYear}`,
          isRead: false,
          relatedId: request.id
        });
      }
      if (school) {
        const user = await storage.getUser(requestData.userId);
        console.log("Looking up user with ID:", requestData.userId, "Found:", !!user);
        if (user) {
          await storage.createAlumniBadge({
            userId: requestData.userId,
            school: school.name,
            fullName: user.fullName,
            admissionYear: requestData.admissionYear,
            graduationYear: requestData.graduationYear,
            status: "pending"
          });
        } else {
          console.error("User not found for ID:", requestData.userId);
          return res.status(400).json({ message: "User not found for alumni badge creation" });
        }
      }
      await storage.createNotification({
        userId: requestData.userId,
        type: "alumni_request_sent",
        title: "Alumni Status Request Sent",
        message: `Alumni status request successfully sent to ${school?.name || "the school"}`,
        isRead: false,
        relatedId: request.id
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating alumni request:", error);
      res.status(500).json({ message: "Failed to create alumni request" });
    }
  });
  app2.patch("/api/alumni-requests/:requestId/approve", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      const request = await storage.getAlumniRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Alumni request not found" });
      }
      const school = await storage.getSchool(request.schoolId);
      if (school) {
        const userBadges = await storage.getAlumniBadgesByUser(request.userId);
        const pendingBadge = userBadges.find(
          (badge) => badge.school === school.name && badge.status === "pending" && badge.admissionYear === request.admissionYear && badge.graduationYear === request.graduationYear
        );
        if (pendingBadge) {
          await storage.updateAlumniBadgeStatus(pendingBadge.id, "verified");
        }
      }
      await storage.createNotification({
        userId: request.userId,
        type: "alumni_approved",
        title: "Alumni Status Approved!",
        message: `Your alumni status request has been approved. You now have alumni access to memories and content.`,
        isRead: false,
        relatedId: requestId
      });
      if (school?.adminUserId) {
        const user = await storage.getUser(request.userId);
        await storage.createNotification({
          userId: school.adminUserId,
          type: "alumni_approved_confirmation",
          title: "Alumni Request Approved",
          message: `You approved ${user?.fullName || "an alumni"}'s request`,
          isRead: false,
          relatedId: requestId
        });
      }
      await storage.deleteAlumniRequest(requestId);
      res.json({ message: "Alumni request approved successfully", request });
    } catch (error) {
      console.error("Error approving alumni request:", error);
      res.status(500).json({ message: "Failed to approve alumni request" });
    }
  });
  app2.patch("/api/alumni-requests/:requestId/deny", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewedBy, reviewNotes } = req.body;
      const updatedRequest = await storage.updateAlumniRequestStatus(requestId, "denied", reviewedBy, reviewNotes);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Alumni request not found" });
      }
      const request = await storage.getAlumniRequestById(requestId);
      if (request) {
        const school = await storage.getSchool(request.schoolId);
        if (school) {
          const userBadges = await storage.getAlumniBadgesByUser(request.userId);
          const pendingBadge = userBadges.find(
            (badge) => badge.school === school.name && badge.status === "pending" && badge.admissionYear === request.admissionYear && badge.graduationYear === request.graduationYear
          );
          if (pendingBadge) {
            await storage.deleteAlumniBadge(pendingBadge.id);
          }
        }
        await storage.createNotification({
          userId: request.userId,
          type: "alumni_denied",
          title: "Alumni Status Denied",
          message: `Your alumni request to ${school?.name || "the school"} has been denied.${reviewNotes ? ` Reason: ${reviewNotes}` : ""}`,
          isRead: false,
          relatedId: requestId
        });
        if (school?.adminUserId) {
          const user = await storage.getUser(request.userId);
          await storage.createNotification({
            userId: school.adminUserId,
            type: "alumni_denied_confirmation",
            title: "Alumni Request Denied",
            message: `You denied ${user?.fullName || "a user"}'s alumni request`,
            isRead: false,
            relatedId: requestId
          });
        }
      }
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error denying alumni request:", error);
      res.status(500).json({ message: "Failed to deny alumni request" });
    }
  });
  app2.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteOldNotifications(30);
      const notifications3 = await storage.getNotificationsByUser(userId);
      res.json(notifications3);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  app2.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const success = await storage.markNotificationAsRead(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.delete("/api/notifications/user/:userId/clear-all", async (req, res) => {
    try {
      const { userId } = req.params;
      const count = await storage.clearAllNotifications(userId);
      res.json({ message: "All notifications cleared", count });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });
  app2.post("/api/notifications/cleanup", async (req, res) => {
    try {
      const daysOld = 30;
      const count = await storage.deleteOldNotifications(daysOld);
      res.json({ message: `Deleted ${count} old notifications` });
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
      res.status(500).json({ message: "Failed to cleanup old notifications" });
    }
  });
  app2.get("/api/schools/:id", async (req, res) => {
    try {
      let school = await storage.getSchool(req.params.id);
      if (!school) {
        school = await storage.getSchoolByAdminUserId(req.params.id);
      }
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error in /api/schools/:id:", error);
      res.status(500).json({ message: "Failed to get school" });
    }
  });
  app2.patch("/api/schools/:id", async (req, res) => {
    try {
      const { address, state, email, city, website } = req.body;
      const schoolId = req.params.id;
      const updateData = {};
      if (address !== void 0) updateData.address = address;
      if (state !== void 0) updateData.state = state;
      if (email !== void 0) updateData.email = email;
      if (city !== void 0) updateData.city = city;
      if (website !== void 0) updateData.website = website;
      const updatedSchool = await storage.updateSchoolProfile(schoolId, updateData);
      if (!updatedSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error updating school profile:", error);
      res.status(500).json({ message: "Failed to update school profile" });
    }
  });
  app2.post("/api/schools/:id/logo", upload.single("schoolLogo"), async (req, res) => {
    try {
      const schoolId = req.params.id;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      if (!req.file) {
        return res.status(400).json({ message: "No logo file uploaded" });
      }
      const logoPath = req.file.path;
      const existingSchool = await storage.getSchoolById(schoolId);
      if (!existingSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      if (existingSchool.logo) {
        try {
          await fs.unlink(existingSchool.logo);
          console.log(`Deleted old logo: ${existingSchool.logo}`);
        } catch (error) {
          console.log(`Could not delete old logo: ${existingSchool.logo}`, error);
        }
      }
      const updatedSchool = await storage.updateSchoolLogo(schoolId, logoPath);
      if (!updatedSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json({
        message: "Logo uploaded successfully",
        logoUrl: `/public/${logoPath}`,
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error uploading school logo:", error);
      res.status(500).json({ message: "Failed to upload school logo" });
    }
  });
  app2.get("/api/users/:userId/login-activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const requestingUserId = authHeader.substring(7);
      if (requestingUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const activities = await storage.getLoginActivitiesByUser(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching login activity:", error);
      res.status(500).json({ message: "Failed to fetch login activity" });
    }
  });
  app2.get("/api/users/:userId/recent-login", async (req, res) => {
    try {
      const { userId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const requestingUserId = authHeader.substring(7);
      if (requestingUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const recentLogin = await storage.getMostRecentLogin(userId);
      if (!recentLogin) {
        return res.status(404).json({ message: "No login activity found" });
      }
      res.json(recentLogin);
    } catch (error) {
      console.error("Error fetching recent login:", error);
      res.status(500).json({ message: "Failed to fetch recent login" });
    }
  });
  app2.patch("/api/users/profile", async (req, res) => {
    try {
      const { email, username, fullName, currentPassword, newPassword } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization required" });
      }
      const userId = authHeader.substring(7);
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password required" });
        }
        if (currentUser.password !== currentPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }
      const updateData = {};
      if (email !== void 0) updateData.email = email;
      if (username !== void 0) updateData.username = username;
      if (fullName !== void 0) updateData.fullName = fullName;
      if (newPassword !== void 0) updateData.password = newPassword;
      if (Object.keys(updateData).length === 0) {
        const { password: password2, ...safeUser2 } = currentUser;
        return res.json(safeUser2);
      }
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    try {
      const { showPhoneToAlumni, phoneNumber } = req.body;
      const userId = req.params.id;
      const updateData = {};
      if (showPhoneToAlumni !== void 0) updateData.showPhoneToAlumni = showPhoneToAlumni;
      if (phoneNumber !== void 0) updateData.phoneNumber = phoneNumber;
      if (Object.keys(updateData).length === 0) {
        const currentUser = await storage.getUserById(userId);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password: password2, ...safeUser2 } = currentUser;
        return res.json(safeUser2);
      }
      const updatedUser = await storage.updateUserPrivacySettings(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user privacy settings:", error);
      res.status(500).json({ message: "Failed to update user privacy settings" });
    }
  });
  app2.get("/api/test-auth", async (req, res) => {
    const authHeader = req.headers.authorization;
    console.log("[TEST] Auth header received:", authHeader);
    res.json({
      hasAuthHeader: !!authHeader,
      authHeader: authHeader || null,
      userId: authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
    });
  });
  app2.put("/api/users/currency", async (req, res) => {
    try {
      const { preferredCurrency } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization required" });
      }
      const userId = authHeader.substring(7);
      if (!preferredCurrency || !["USD", "NGN"].includes(preferredCurrency)) {
        return res.status(400).json({ error: "Invalid currency preference" });
      }
      const updatedUser = await storage.updateUserProfile(userId, { preferredCurrency });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "Currency preference updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating currency preference:", error);
      res.status(500).json({ error: "Failed to update currency preference" });
    }
  });
  app2.get("/api/memories/school/:schoolId/pending", async (req, res) => {
    console.log("=== PENDING MEMORIES ROUTE START ===");
    try {
      const { schoolId } = req.params;
      console.log("1. SchoolId:", schoolId);
      const authHeader = req.headers.authorization;
      console.log("2. Auth header:", authHeader ? "Present" : "Missing");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("AUTH FAIL: No Bearer token");
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      console.log("3. User ID:", userId);
      const user = await storage.getUser(userId);
      console.log("4. User found:", user ? user.userType : "Not found");
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        console.log("AUTH FAIL: Insufficient privileges");
        return res.status(403).json({ message: "School admin privileges required" });
      }
      console.log("5. User type check:", user.userType);
      if (user.userType === "school_admin" || user.userType === "school") {
        console.log("6. Checking school access for non-super-admin");
        const userSchool = await storage.getSchoolByAdminUserId(userId);
        if (!userSchool || userSchool.id !== schoolId) {
          console.log("SCHOOL ACCESS FAIL");
          return res.status(403).json({ message: "Access denied for this school" });
        }
      } else {
        console.log("6. Skipping school check for super_admin");
      }
      console.log("7. About to call getSimplePendingMemories");
      const rawMemories = await getSimplePendingMemories(schoolId);
      console.log("8. Got memories:", rawMemories ? rawMemories.length : "null");
      const pendingMemories = rawMemories.map((memory) => ({
        id: memory.id,
        title: memory.title,
        description: memory.description,
        imageUrl: memory.image_url ? `/public${memory.image_url}` : null,
        mediaType: memory.media_type,
        eventDate: memory.event_date,
        year: memory.year,
        category: memory.category,
        status: memory.status,
        uploadedBy: memory.uploaded_by,
        createdAt: memory.created_at
      }));
      res.setHeader("Cache-Control", "no-store");
      res.json(pendingMemories);
      console.log("9. Response sent successfully");
    } catch (error) {
      console.error("ERROR in pending memories route:", error);
      res.status(500).json({ message: "Failed to fetch pending memories" });
    }
  });
  app2.get("/api/memories/school/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const validYear = validateYear(year);
      if (validYear === null) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      const allMemories = await storage.getMemoriesBySchoolAndYear(schoolId, validYear);
      const approvedMemories = allMemories.filter((memory) => memory.status === "approved");
      res.json(approvedMemories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get memories" });
    }
  });
  app2.post("/api/memories", upload.single("memoryFile"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { title, description, eventDate, year, category, schoolId, uploadedBy } = req.body;
      if (!year || isNaN(parseInt(year, 10))) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      let memoryStatus = "pending";
      let uploaderName = uploadedBy || null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const userId = authHeader.substring(7);
        const user = await storage.getUser(userId);
        if (user && (user.userType === "school" || user.userType === "school_admin" || user.userType === "super_admin")) {
          memoryStatus = "approved";
          uploaderName = user.fullName;
        } else if (user) {
          uploaderName = user.fullName;
        }
      }
      const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
      const mediaUrl = `/uploads/memories/${file.filename}`;
      const memoryData = {
        schoolId,
        title,
        description: description || null,
        imageUrl: mediaType === "image" ? mediaUrl : null,
        videoUrl: mediaType === "video" ? mediaUrl : null,
        mediaType,
        eventDate,
        year: parseInt(year),
        category: category || null,
        tags: [],
        status: memoryStatus,
        uploadedBy: uploaderName
      };
      const validatedData = insertMemorySchema.parse(memoryData);
      const memory = await storage.createMemory(validatedData);
      if (memoryStatus === "pending") {
        const school = await storage.getSchool(schoolId);
        if (school?.adminUserId) {
          await storage.createNotification({
            userId: school.adminUserId,
            type: "memory_uploaded",
            title: "New Memory Pending Approval",
            message: `${uploaderName || "A user"} uploaded a new memory: ${title}`,
            isRead: false,
            relatedId: memory.id
          });
        }
      }
      const responseMessage = memoryStatus === "pending" ? "Memory uploaded successfully! It's pending approval by the school." : "Memory uploaded and published successfully!";
      res.status(201).json({ ...memory, message: responseMessage });
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Failed to create memory" });
    }
  });
  app2.patch("/api/memories/:memoryId/approve", async (req, res) => {
    try {
      const { memoryId } = req.params;
      const { approvedBy } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      const memory = await storage.getMemoryById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const userSchool = await storage.getSchoolByAdminUserId(userId);
        if (!userSchool || userSchool.id !== memory.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const updatedMemory = await storage.approveMemory(memoryId, approvedBy || userId);
      res.json(updatedMemory);
    } catch (error) {
      console.error("Error approving memory:", error);
      res.status(500).json({ message: "Failed to approve memory" });
    }
  });
  app2.patch("/api/memories/:memoryId/title", async (req, res) => {
    try {
      const { memoryId } = req.params;
      const { title } = req.body;
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: "Title is required" });
      }
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      const memory = await storage.getMemoryById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const userSchool = await storage.getSchoolByAdminUserId(userId);
        if (!userSchool || userSchool.id !== memory.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const updatedMemory = await storage.updateMemoryTitle(memoryId, title.trim());
      if (!updatedMemory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      res.json(updatedMemory);
    } catch (error) {
      console.error("Error updating memory title:", error);
      res.status(500).json({ message: "Failed to update memory title" });
    }
  });
  app2.delete("/api/memories/:memoryId", async (req, res) => {
    try {
      const { memoryId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      const memory = await storage.getMemoryById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const userSchool = await storage.getSchoolByAdminUserId(userId);
        if (!userSchool || userSchool.id !== memory.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const fs3 = await import("fs");
      const path4 = await import("path");
      try {
        if (memory.imageUrl) {
          const imagePath = path4.default.join(__dirname, "../public", memory.imageUrl);
          if (fs3.default.existsSync(imagePath)) {
            fs3.default.unlinkSync(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
          }
        }
        if (memory.videoUrl) {
          const videoPath = path4.default.join(__dirname, "../public", memory.videoUrl);
          if (fs3.default.existsSync(videoPath)) {
            fs3.default.unlinkSync(videoPath);
            console.log(`Deleted video file: ${videoPath}`);
          }
        }
      } catch (fileError) {
        console.error("Error deleting files:", fileError);
      }
      await storage.deleteMemory(memoryId);
      res.json({ message: "Memory deleted successfully" });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ message: "Failed to delete memory" });
    }
  });
  app2.post("/api/public-upload-links", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== req.body.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const publicLinkData = {
        schoolId: req.body.schoolId,
        year: req.body.year ? parseInt(req.body.year) : void 0,
        category: req.body.category,
        validForHours: req.body.validForHours ? parseInt(req.body.validForHours) : void 0
      };
      if (!publicLinkData.schoolId || !publicLinkData.year || !publicLinkData.category || !publicLinkData.validForHours) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existingLinks = await storage.getPublicUploadLinksBySchoolAndYear(publicLinkData.schoolId, publicLinkData.year);
      const activeLink = existingLinks.find(
        (link) => link.category === publicLinkData.category && link.isActive && /* @__PURE__ */ new Date() < link.expiresAt
      );
      if (activeLink) {
        return res.status(409).json({
          message: `An active upload link for ${publicLinkData.category} already exists for ${publicLinkData.year}. Please wait for it to expire or deactivate it first.`,
          existingLink: {
            expiresAt: activeLink.expiresAt.toISOString(),
            category: activeLink.category,
            id: activeLink.id
          }
        });
      }
      const maxHours = Math.min(publicLinkData.validForHours, 48);
      const expiresAt = new Date(Date.now() + maxHours * 60 * 60 * 1e3);
      const result = await storage.createPublicUploadLink({
        schoolId: publicLinkData.schoolId,
        year: publicLinkData.year,
        category: publicLinkData.category,
        expiresAt,
        createdBy: userId
      });
      res.status(201).json({
        linkCode: result.linkCode,
        id: result.id,
        expiresAt: expiresAt.toISOString(),
        schoolId: publicLinkData.schoolId,
        year: publicLinkData.year,
        category: publicLinkData.category
      });
    } catch (error) {
      console.error("Error creating public upload link:", error);
      res.status(500).json({ message: "Failed to create upload link" });
    }
  });
  app2.get("/api/public-upload-links/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const verificationCode = req.query.verificationCode;
      const authHeader = req.headers.authorization;
      const isLoggedIn = authHeader && authHeader.startsWith("Bearer ");
      if (!isLoggedIn) {
        if (verificationCode !== "1234") {
          return res.status(400).json({ message: "Verification failed. Please enter the correct code." });
        }
      }
      const formattedCode = code.length === 16 && !code.includes("-") ? `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}` : code;
      const link = await storage.getPublicUploadLinkByCode(formattedCode);
      if (!link) {
        return res.status(404).json({ message: "This code has expired or is invalid" });
      }
      if (!link.isActive) {
        return res.status(410).json({ message: "Upload link is no longer active" });
      }
      res.json({
        id: link.id,
        schoolId: link.schoolId,
        year: link.year,
        category: link.category,
        isValid: true
      });
    } catch (error) {
      console.error("Error validating upload link:", error);
      res.status(500).json({ message: "Failed to validate upload link" });
    }
  });
  app2.get("/api/public-upload-links/school/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const validYear = validateYear(year);
      if (validYear === null) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      const links = await storage.getPublicUploadLinksBySchoolAndYear(schoolId, validYear);
      res.json(links);
    } catch (error) {
      console.error("Error fetching public upload links:", error);
      res.status(500).json({ message: "Failed to fetch upload links" });
    }
  });
  app2.patch("/api/public-upload-links/:linkId/toggle", async (req, res) => {
    try {
      const { linkId } = req.params;
      const { isActive } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      const link = await storage.getPublicUploadLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Upload link not found" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== link.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const updatedLink = await storage.updatePublicUploadLinkStatus(linkId, isActive);
      res.json(updatedLink);
    } catch (error) {
      console.error("Error updating upload link status:", error);
      res.status(500).json({ message: "Failed to update link status" });
    }
  });
  app2.delete("/api/public-upload-links/:linkId", async (req, res) => {
    try {
      const { linkId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school_admin" && user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      const link = await storage.getPublicUploadLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Upload link not found" });
      }
      if (user.userType === "school_admin" || user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== link.schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      await storage.deletePublicUploadLink(linkId);
      res.json({ message: "Upload link deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload link:", error);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });
  app2.post("/api/public-uploads/:code", upload.single("memoryFile"), async (req, res) => {
    try {
      const { code } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { title, description, uploadedBy, verificationCode } = req.body;
      if (!uploadedBy) {
        return res.status(400).json({ message: "Uploaded by name is required" });
      }
      const authHeader = req.headers.authorization;
      const isLoggedIn = authHeader && authHeader.startsWith("Bearer ");
      if (!isLoggedIn) {
        if (verificationCode !== "1234") {
          return res.status(400).json({ message: "Invalid verification code" });
        }
      }
      const formattedCode = code.length === 16 && !code.includes("-") ? `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}` : code;
      const link = await storage.getPublicUploadLinkByCode(formattedCode);
      if (!link) {
        return res.status(404).json({ message: "This code has expired or is invalid" });
      }
      if (!link.isActive) {
        return res.status(410).json({ message: "Upload link is no longer active" });
      }
      const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
      const mediaUrl = `/uploads/memories/${file.filename}`;
      const memoryData = {
        schoolId: link.schoolId,
        title: title || "Untitled",
        description: description || null,
        imageUrl: mediaType === "image" ? mediaUrl : null,
        videoUrl: mediaType === "video" ? mediaUrl : null,
        mediaType,
        eventDate: link.year.toString(),
        year: link.year,
        category: link.category,
        tags: [],
        status: "pending",
        uploadedBy,
        publicUploadLinkId: link.id
      };
      const validatedData = insertMemorySchema.parse(memoryData);
      const memory = await storage.createMemory(validatedData);
      const school = await storage.getSchool(link.schoolId);
      if (school?.adminUserId) {
        await storage.createNotification({
          userId: school.adminUserId,
          type: "memory_uploaded",
          title: "New Memory Pending Approval",
          message: `${uploadedBy || "A guest"} uploaded a new memory via public link`,
          isRead: false,
          relatedId: memory.id
        });
      }
      res.status(201).json({
        id: memory.id,
        message: "Photo/video uploaded successfully! It's pending approval by the school."
      });
    } catch (error) {
      console.error("Error processing public upload:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/year-purchases/school/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching year purchases:", error);
      res.status(500).json({ message: "Failed to get year purchases" });
    }
  });
  app2.post("/api/year-purchases", async (req, res) => {
    try {
      const purchaseData = req.body;
      if (purchaseData.purchaseDate && typeof purchaseData.purchaseDate === "string") {
        purchaseData.purchaseDate = new Date(purchaseData.purchaseDate);
      }
      const purchase = await storage.createYearPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating year purchase:", error);
      res.status(500).json({ message: "Failed to create year purchase" });
    }
  });
  app2.patch("/api/year-purchases/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { purchased } = req.body;
      const updatedPurchase = await storage.updateYearPurchase(purchaseId, purchased);
      if (!updatedPurchase) {
        return res.status(404).json({ message: "Year purchase not found" });
      }
      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating year purchase:", error);
      res.status(500).json({ message: "Failed to update year purchase" });
    }
  });
  app2.get("/api/viewer-year-purchases/:userId/:schoolId", async (req, res) => {
    try {
      const { userId, schoolId } = req.params;
      const purchases = await storage.getViewerYearPurchases(userId, schoolId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching viewer year purchases:", error);
      res.status(500).json({ message: "Failed to get viewer year purchases" });
    }
  });
  app2.get("/api/library/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`\u{1F4DA} Library API called for userId: ${userId}`);
      const purchases = await storage.getAllViewerYearPurchases(userId);
      console.log(`\u{1F4DA} Found ${purchases.length} purchased yearbooks`);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching library yearbooks:", error);
      res.status(500).json({ message: "Failed to get library yearbooks" });
    }
  });
  app2.post("/api/viewer-year-purchases", async (req, res) => {
    try {
      const purchaseData = req.body;
      if (purchaseData.purchaseDate && typeof purchaseData.purchaseDate === "string") {
        purchaseData.purchaseDate = new Date(purchaseData.purchaseDate);
      }
      const purchase = await storage.createViewerYearPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating viewer year purchase:", error);
      res.status(500).json({ message: "Failed to create viewer year purchase" });
    }
  });
  app2.patch("/api/viewer-year-purchases/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      const { purchased } = req.body;
      const updatedPurchase = await storage.updateViewerYearPurchase(purchaseId, purchased);
      if (!updatedPurchase) {
        return res.status(404).json({ message: "Viewer year purchase not found" });
      }
      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating viewer year purchase:", error);
      res.status(500).json({ message: "Failed to update viewer year purchase" });
    }
  });
  app2.get("/api/cart/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const cartItems2 = await storage.getCartItems(userId);
      res.json(cartItems2);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });
  app2.post("/api/cart", async (req, res) => {
    try {
      const cartItemData = req.body;
      const existingItem = await storage.getCartItem(
        cartItemData.userId,
        cartItemData.schoolId,
        cartItemData.year
      );
      if (existingItem) {
        return res.status(409).json({ message: "Item already in cart" });
      }
      const cartItem = await storage.addCartItem(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  app2.delete("/api/cart/:cartItemId", async (req, res) => {
    try {
      const { cartItemId } = req.params;
      const success = await storage.removeCartItem(cartItemId);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });
  app2.delete("/api/cart/clear/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  const validateYear = (yearParam) => {
    const year = parseInt(yearParam, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return null;
    }
    return year;
  };
  app2.get("/api/yearbooks/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const validYear = validateYear(year);
      if (validYear === null) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      const yearbook = await storage.getYearbookBySchoolAndYear(schoolId, validYear);
      if (!yearbook) {
        return res.status(404).json({ message: "Yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error fetching yearbook:", error);
      res.status(500).json({ message: "Failed to get yearbook" });
    }
  });
  app2.get("/api/published-yearbooks/:schoolId/:year", async (req, res) => {
    try {
      const { schoolId, year } = req.params;
      const validYear = validateYear(year);
      if (validYear === null) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      const yearbook = await storage.getPublishedYearbook(schoolId, validYear);
      if (!yearbook) {
        return res.status(404).json({ message: "Published yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error fetching published yearbook:", error);
      res.status(500).json({ message: "Failed to get published yearbook" });
    }
  });
  app2.get("/api/published-yearbooks-list/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const publishedYearbooks = await storage.getAllPublishedYearbooks(schoolId);
      res.json(publishedYearbooks);
    } catch (error) {
      console.error("Error fetching all published yearbooks:", error);
      res.status(500).json({ message: "Failed to get published yearbooks" });
    }
  });
  app2.post("/api/yearbooks", async (req, res) => {
    try {
      const { year, schoolId } = req.body;
      if (!schoolId) {
        return res.status(400).json({ error: "School ID is required" });
      }
      if (!year || typeof year !== "number" || isNaN(year) || year < 1900 || year > 2100) {
        return res.status(400).json({ error: "Invalid or missing year parameter" });
      }
      const yearbook = await storage.createYearbook(req.body);
      res.status(201).json(yearbook);
    } catch (error) {
      console.error("Error creating yearbook:", error);
      res.status(500).json({ message: "Failed to create yearbook" });
    }
  });
  app2.patch("/api/yearbooks/:yearbookId/publish", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { isPublished } = req.body;
      const yearbook = await storage.updateYearbookPublishStatus(yearbookId, isPublished);
      if (!yearbook) {
        return res.status(404).json({ message: "Yearbook not found" });
      }
      res.json(yearbook);
    } catch (error) {
      console.error("Error updating yearbook:", error);
      res.status(500).json({ message: "Failed to update yearbook" });
    }
  });
  const extractPdfPages = async (pdfPath, outputDir) => {
    try {
      console.log("Extracting PDF pages from:", pdfPath);
      const pdfConverter = fromPath(pdfPath, {
        density: 150,
        // DPI for output images
        saveFilename: "page",
        // Base filename
        savePath: outputDir,
        // Output directory
        format: "jpg",
        // Output format
        width: 1200,
        // Max width
        height: 1600,
        // Max height (maintain aspect ratio)
        quality: 85
        // JPEG quality
      });
      const pages = await pdfConverter.bulk(-1, { responseType: "image" });
      console.log(`Extracted ${pages.length} pages from PDF`);
      const imagePaths = pages.map((page) => {
        console.log("PDF page result:", page);
        return page.path;
      });
      return imagePaths;
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error("Failed to extract PDF pages");
    }
  };
  app2.post("/api/yearbooks/:yearbookId/upload-page", upload.single("file"), async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { pageType, title } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (pageType === "front_cover" || pageType === "back_cover") {
        const existingPages = await storage.getYearbookPages(yearbookId);
        const existingCover = existingPages.find((p) => p.pageType === pageType);
        if (existingCover) {
          const oldImagePath = path.join(process.cwd(), "public", existingCover.imageUrl);
          try {
            await fs.unlink(oldImagePath);
          } catch (error) {
            console.warn("Could not delete old cover image:", oldImagePath, error);
          }
          await storage.deleteYearbookPage(existingCover.id);
        }
      }
      const isPdf = req.file.mimetype === "application/pdf";
      if (isPdf) {
        if (pageType === "content") {
          const existingPages = await storage.getYearbookPages(yearbookId);
          const hasContentPages = existingPages.some((p) => p.pageType === "content" || p.pageType === "front_cover" || p.pageType === "back_cover");
          if (hasContentPages) {
            await fs.unlink(path.join(process.cwd(), "public/uploads/yearbooks", req.file.filename));
            return res.status(400).json({
              message: "A PDF has already been uploaded for this yearbook. Please delete all existing pages first before uploading a new PDF.",
              error: "PDF_ALREADY_EXISTS"
            });
          }
        }
        console.log("Processing PDF upload:", req.file.filename);
        const uploadedPdfPath = path.join(process.cwd(), "public/uploads/yearbooks", req.file.filename);
        const pdfOutputDir = path.join(process.cwd(), "public/uploads/yearbooks", `pdf_pages_${Date.now()}`);
        await fs.mkdir(pdfOutputDir, { recursive: true });
        try {
          const extractedImagePaths = await extractPdfPages(uploadedPdfPath, pdfOutputDir);
          const createdPages = [];
          for (let i = 0; i < extractedImagePaths.length; i++) {
            const imagePath = extractedImagePaths[i];
            if (!fsSync.existsSync(imagePath)) {
              console.error(`PDF page file not found: ${imagePath}`);
              continue;
            }
            const relativeImagePath = imagePath.replace(path.join(process.cwd(), "public/uploads/yearbooks/"), "");
            const pathParts = relativeImagePath.split(path.sep);
            const directoryName = pathParts[0];
            const fileName = pathParts[1];
            const imageUrl = `/api/secure-image/yearbooks/${directoryName}/${fileName}`;
            console.log(`Creating page with imageUrl: ${imageUrl} from path: ${imagePath}`);
            let currentPageType = pageType;
            let currentTitle = title;
            if (pageType === "front_cover") {
              currentPageType = "front_cover";
              currentTitle = `${title} - Cover`;
            } else if (pageType === "back_cover") {
              currentPageType = "back_cover";
              currentTitle = `${title} - Back Cover`;
            } else {
              if (i === 0) {
                currentPageType = "front_cover";
                currentTitle = "Front Cover";
              } else if (i === extractedImagePaths.length - 1) {
                currentPageType = "back_cover";
                currentTitle = "Back Cover";
              } else {
                currentPageType = "content";
                currentTitle = `Page ${i}`;
              }
            }
            const pageNumber = currentPageType === "front_cover" || currentPageType === "back_cover" ? 0 : await storage.getNextPageNumber(yearbookId);
            const page = await storage.createYearbookPage({
              yearbookId,
              title: currentTitle,
              imageUrl,
              pageType: currentPageType,
              pageNumber
            });
            createdPages.push(page);
            if (pageType === "front_cover" && i === 0) break;
            if (pageType === "back_cover" && i === extractedImagePaths.length - 1) break;
          }
          if (pageType === "content" && createdPages.length >= 2) {
            const frontCover = createdPages[0];
            const backCover = createdPages[createdPages.length - 1];
            await storage.updateYearbookCovers(
              yearbookId,
              frontCover.imageUrl,
              backCover.imageUrl
            );
            console.log(`Auto-assigned covers: front=${frontCover.imageUrl}, back=${backCover.imageUrl}`);
          }
          await fs.unlink(uploadedPdfPath);
          res.status(201).json({
            message: `PDF processed successfully. Created ${createdPages.length} page(s).`,
            pages: createdPages,
            pagesCreated: createdPages.length,
            isPDFProcessed: true,
            coversAutoAssigned: pageType === "content" && createdPages.length >= 2
          });
        } catch (error) {
          console.error("PDF processing error:", error);
          try {
            await fs.unlink(uploadedPdfPath);
          } catch (cleanupError) {
            console.warn("Could not clean up PDF file:", cleanupError);
          }
          return res.status(500).json({ message: "Failed to process PDF. Please try with individual image files." });
        }
      } else {
        const imageUrl = `/api/secure-image/yearbooks/${req.file.filename}`;
        const pageNumber = pageType === "front_cover" || pageType === "back_cover" ? 0 : await storage.getNextPageNumber(yearbookId);
        const page = await storage.createYearbookPage({
          yearbookId,
          title,
          imageUrl,
          pageType,
          pageNumber
        });
        res.status(201).json(page);
      }
    } catch (error) {
      console.error("Error uploading page:", error);
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File too large. Maximum size is 20MB." });
        }
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to upload page" });
    }
  });
  app2.delete("/api/yearbooks/pages/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const page = await storage.getYearbookPageById(pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      const success = await storage.deleteYearbookPage(pageId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete page from database" });
      }
      try {
        const imageUrl = page.imageUrl;
        if (imageUrl.startsWith("/api/secure-image/yearbooks/")) {
          const urlParts = imageUrl.split("/");
          const lastPart = urlParts[urlParts.length - 1];
          const secondLastPart = urlParts[urlParts.length - 2];
          if (secondLastPart && secondLastPart.startsWith("pdf_pages_")) {
            const folderPath = path.join(process.cwd(), "public/uploads/yearbooks", secondLastPart);
            const filePath = path.join(folderPath, lastPart);
            if (fsSync.existsSync(filePath)) {
              await fs.unlink(filePath);
              console.log(`Deleted PDF-extracted image: ${filePath}`);
            }
            try {
              const folderContents = await fs.readdir(folderPath);
              if (folderContents.length === 0) {
                await fs.rmdir(folderPath);
                console.log(`Deleted empty PDF folder: ${folderPath}`);
              }
            } catch (folderError) {
              console.warn(`Could not clean up PDF folder ${folderPath}:`, folderError);
            }
          } else {
            const filePath = path.join(process.cwd(), "public/uploads/yearbooks", lastPart);
            if (fsSync.existsSync(filePath)) {
              await fs.unlink(filePath);
              console.log(`Deleted yearbook image: ${filePath}`);
            }
          }
        }
      } catch (cleanupError) {
        console.warn("Could not clean up image file:", cleanupError);
      }
      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });
  app2.patch("/api/yearbooks/pages/:pageId/reorder", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { pageNumber } = req.body;
      if (typeof pageNumber !== "number" || pageNumber < 1) {
        return res.status(400).json({ message: "Invalid page number" });
      }
      const updatedPage = await storage.updateYearbookPageOrder(pageId, pageNumber);
      if (!updatedPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(updatedPage);
    } catch (error) {
      console.error("Error reordering page:", error);
      res.status(500).json({ message: "Failed to reorder page" });
    }
  });
  app2.post("/api/yearbooks/:yearbookId/table-of-contents", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const tocItem = await storage.createTableOfContentsItem({
        ...req.body,
        yearbookId
      });
      res.status(201).json(tocItem);
    } catch (error) {
      console.error("Error creating TOC item:", error);
      res.status(500).json({ message: "Failed to create table of contents item" });
    }
  });
  app2.patch("/api/yearbooks/table-of-contents/:tocId", async (req, res) => {
    try {
      const { tocId } = req.params;
      const updatedItem = await storage.updateTableOfContentsItem(tocId, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: "TOC item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating TOC item:", error);
      res.status(500).json({ message: "Failed to update table of contents item" });
    }
  });
  app2.delete("/api/yearbooks/table-of-contents/:tocId", async (req, res) => {
    try {
      const { tocId } = req.params;
      const success = await storage.deleteTableOfContentsItem(tocId);
      if (!success) {
        return res.status(404).json({ message: "TOC item not found" });
      }
      res.json({ message: "TOC item deleted successfully" });
    } catch (error) {
      console.error("Error deleting TOC item:", error);
      res.status(500).json({ message: "Failed to delete table of contents item" });
    }
  });
  app2.patch("/api/yearbooks/:yearbookId", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { orientation, uploadType, isInitialized } = req.body;
      console.log("\u{1F4DD} Updating yearbook setup:", { yearbookId, orientation, uploadType, isInitialized });
      if (orientation && !["portrait", "landscape"].includes(orientation)) {
        return res.status(400).json({ message: "Invalid orientation. Must be 'portrait' or 'landscape'" });
      }
      if (uploadType && !["image", "pdf"].includes(uploadType)) {
        return res.status(400).json({ message: "Invalid upload type. Must be 'image' or 'pdf'" });
      }
      const updates = {};
      if (orientation !== void 0) {
        updates.orientation = orientation;
      }
      if (uploadType !== void 0) {
        updates.uploadType = uploadType;
      }
      if (isInitialized !== void 0) {
        updates.isInitialized = isInitialized;
      }
      console.log("\u{1F4E6} Updates to apply:", updates);
      const updatedYearbook = await storage.updateYearbook(yearbookId, updates);
      if (!updatedYearbook) {
        console.error("\u274C Yearbook not found:", yearbookId);
        return res.status(404).json({ message: "Yearbook not found" });
      }
      console.log("\u2705 Yearbook updated successfully:", {
        id: updatedYearbook.id,
        orientation: updatedYearbook.orientation,
        uploadType: updatedYearbook.uploadType,
        isInitialized: updatedYearbook.isInitialized
      });
      res.json(updatedYearbook);
    } catch (error) {
      console.error("\u274C Error updating yearbook:", error);
      res.status(500).json({ message: "Failed to update yearbook" });
    }
  });
  app2.patch("/api/yearbooks/:yearbookId/price", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const { price, userId } = req.body;
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        return res.status(400).json({ message: "Invalid price format" });
      }
      if (priceNum < 1.99 || priceNum > 49.99) {
        return res.status(400).json({ message: "Price must be between $1.99 and $49.99" });
      }
      const result = await storage.updateYearbookPrice(yearbookId, price, userId);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating yearbook price:", error);
      res.status(500).json({ message: "Failed to update yearbook price" });
    }
  });
  app2.get("/api/yearbooks/:yearbookId/price-history", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const history = await storage.getYearbookPriceHistory(yearbookId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });
  app2.get("/api/yearbooks/:yearbookId/can-increase-price", async (req, res) => {
    try {
      const { yearbookId } = req.params;
      const result = await storage.canIncreaseYearbookPrice(yearbookId);
      res.json(result);
    } catch (error) {
      console.error("Error checking price increase eligibility:", error);
      res.status(500).json({ message: "Failed to check price increase eligibility" });
    }
  });
  app2.get("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const safeUsers = users2.map((user) => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/super-admin/schools", requireSuperAdmin, async (req, res) => {
    try {
      const schools2 = await storage.getAllSchools();
      const schoolsWithAdmin = await Promise.all(schools2.map(async (school) => {
        const adminUser = await storage.getSchoolAdminUser(school.id);
        return {
          ...school,
          adminUsername: adminUser?.username || school.tempAdminCredentials?.username || null
        };
      }));
      res.json(schoolsWithAdmin);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });
  app2.get("/api/super-admin/alumni-badges", requireSuperAdmin, async (req, res) => {
    try {
      const badges = await storage.getAllAlumniBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching alumni badges:", error);
      res.status(500).json({ message: "Failed to fetch alumni badges" });
    }
  });
  app2.get("/api/super-admin/alumni-requests", requireSuperAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllAlumniRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching alumni requests:", error);
      res.status(500).json({ message: "Failed to fetch alumni requests" });
    }
  });
  app2.delete("/api/super-admin/users/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.deleteUser(userId);
      if (success) {
        await storage.logAdminAction(
          req.superAdmin.id,
          "deleted_user",
          "user",
          userId,
          { username: req.body.username || "unknown" }
        );
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.delete("/api/super-admin/schools/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const success = await storage.deleteSchool(schoolId);
      if (success) {
        await storage.logAdminAction(
          req.superAdmin.id,
          "deleted_school",
          "school",
          schoolId,
          { schoolName: req.body.schoolName || "unknown" }
        );
        res.json({ message: "School deleted successfully" });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });
  app2.patch("/api/super-admin/users/:userId/role", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { userType } = req.body;
      const validRoles = ["viewer", "school", "super_admin"];
      if (!validRoles.includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }
      const updatedUser = await storage.updateUserRole(userId, userType);
      if (updatedUser) {
        await storage.logAdminAction(
          req.superAdmin.id,
          "updated_user_role",
          "user",
          userId,
          { newRole: userType, previousRole: req.body.previousRole }
        );
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.patch("/api/super-admin/alumni-badges/:badgeId", requireSuperAdmin, async (req, res) => {
    try {
      const { badgeId } = req.params;
      const { status } = req.body;
      if (!["verified", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updatedBadge = await storage.updateAlumniBadgeStatus(badgeId, status);
      if (updatedBadge) {
        await storage.logAdminAction(
          req.superAdmin.id,
          status === "verified" ? "approved_alumni_badge" : "revoked_alumni_badge",
          "alumni_badge",
          badgeId,
          { status, fullName: updatedBadge.fullName }
        );
        res.json(updatedBadge);
      } else {
        res.status(404).json({ message: "Alumni badge not found" });
      }
    } catch (error) {
      console.error("Error updating alumni badge:", error);
      res.status(500).json({ message: "Failed to update alumni badge" });
    }
  });
  app2.delete("/api/super-admin/alumni-badges/:badgeId", requireSuperAdmin, async (req, res) => {
    try {
      const { badgeId } = req.params;
      const success = await storage.deleteAlumniBadge(badgeId);
      if (success) {
        await storage.logAdminAction(
          req.superAdmin.id,
          "deleted_alumni_badge",
          "alumni_badge",
          badgeId,
          { reason: "admin_deletion" }
        );
        res.json({ message: "Alumni badge deleted successfully" });
      } else {
        res.status(404).json({ message: "Alumni badge not found" });
      }
    } catch (error) {
      console.error("Error deleting alumni badge:", error);
      res.status(500).json({ message: "Failed to delete alumni badge" });
    }
  });
  app2.get("/api/super-admin/logs", requireSuperAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });
  app2.get("/api/super-admin/login-activity", requireSuperAdmin, async (req, res) => {
    try {
      const loginActivities = await storage.getLoginActivitiesByUser(req.superAdmin.id, 50);
      res.json(loginActivities);
    } catch (error) {
      console.error("Error fetching login activity:", error);
      res.status(500).json({ message: "Failed to fetch login activity" });
    }
  });
  app2.get("/api/super-admin/pending-schools", requireSuperAdmin, async (req, res) => {
    try {
      const pendingSchools = await storage.getPendingSchools();
      res.json(pendingSchools);
    } catch (error) {
      console.error("Error fetching pending schools:", error);
      res.status(500).json({ message: "Failed to fetch pending schools" });
    }
  });
  app2.post("/api/super-admin/approve-school/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const pendingSchool = await storage.getSchoolById(schoolId);
      if (!pendingSchool || pendingSchool.approvalStatus !== "pending") {
        return res.status(404).json({ message: "Pending school request not found" });
      }
      if (!pendingSchool.tempAdminCredentials) {
        return res.status(400).json({ message: "Admin credentials not found for this school" });
      }
      const generateActivationCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 12; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      let activationCode = generateActivationCode();
      while (await storage.getSchoolByActivationCode(activationCode)) {
        activationCode = generateActivationCode();
      }
      const school = await storage.approveSchool(schoolId, req.superAdmin.id, activationCode);
      if (school) {
        const adminCredentials = pendingSchool.tempAdminCredentials;
        const user = await storage.createUser({
          username: adminCredentials.username,
          password: adminCredentials.password,
          userType: "school",
          firstName: adminCredentials.firstName,
          lastName: adminCredentials.lastName,
          dateOfBirth: "1970-01-01",
          // Default date for school admin accounts
          email: school.email,
          phoneNumber: school.phoneNumber,
          // Copy phone number from school record
          profileImage: null,
          schoolId: school.id
          // Link the user to the school
        });
        await storage.clearTempAdminCredentials(schoolId);
        if (pendingSchool.accreditationDocument) {
          try {
            await fs.unlink(pendingSchool.accreditationDocument);
            console.log(`Deleted accreditation document: ${pendingSchool.accreditationDocument}`);
          } catch (error) {
            console.warn(`Failed to delete accreditation document: ${pendingSchool.accreditationDocument}`, error);
          }
        }
        await storage.logAdminAction(
          req.superAdmin.id,
          "school_approval",
          "school",
          schoolId,
          { schoolName: school.name, activationCode, adminUsername: adminCredentials.username }
        );
        res.json({
          message: "School approved successfully and admin account created",
          school,
          activationCode,
          // Keep for internal purposes
          adminUsername: adminCredentials.username
        });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error approving school:", error);
      res.status(500).json({ message: "Failed to approve school" });
    }
  });
  app2.post("/api/super-admin/reject-school/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { reason } = req.body;
      const school = await storage.rejectSchool(schoolId, req.superAdmin.id, reason);
      if (school) {
        await storage.logAdminAction(
          req.superAdmin.id,
          "school_rejection",
          "school",
          schoolId,
          { schoolName: school.name, reason }
        );
        res.json({
          message: "School request rejected",
          school
        });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      console.error("Error rejecting school:", error);
      res.status(500).json({ message: "Failed to reject school" });
    }
  });
  app2.get("/api/super-admin/analytics", requireSuperAdmin, async (req, res) => {
    try {
      const [users2, schools2, alumniBadges2, alumniRequests2] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllSchools(),
        storage.getAllAlumniBadges(),
        storage.getAllAlumniRequests()
      ]);
      const analytics = {
        totalUsers: users2.length,
        usersByType: {
          viewers: users2.filter((u) => u.userType === "viewer").length,
          schools: users2.filter((u) => u.userType === "school").length,
          superAdmins: users2.filter((u) => u.userType === "super_admin").length
        },
        totalSchools: schools2.length,
        totalAlumniBadges: alumniBadges2.length,
        alumniBadgesByStatus: {
          verified: alumniBadges2.filter((b) => b.status === "verified").length,
          pending: alumniBadges2.filter((b) => b.status === "pending").length
        },
        totalAlumniRequests: alumniRequests2.length,
        alumniRequestsByStatus: {
          pending: alumniRequests2.filter((r) => r.status === "pending").length,
          approved: alumniRequests2.filter((r) => r.status === "approved").length,
          denied: alumniRequests2.filter((r) => r.status === "denied").length
        }
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/super-admin/school-years/:schoolId", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      console.log(`Super Admin Year Management: Using CURRENT_YEAR = ${CURRENT_YEAR}`);
      const yearsList = [];
      for (let year = school.yearFounded; year <= CURRENT_YEAR; year++) {
        const existingPurchase = purchases.find((p) => p.year === year);
        yearsList.push({
          year,
          id: existingPurchase?.id || null,
          purchased: existingPurchase?.purchased || false,
          purchaseDate: existingPurchase?.purchaseDate || null,
          price: existingPurchase?.price || "14.99",
          unlockedByAdmin: existingPurchase?.unlockedByAdmin || false
        });
      }
      res.json({
        school: {
          id: school.id,
          name: school.name,
          yearFounded: school.yearFounded
        },
        years: yearsList
      });
    } catch (error) {
      console.error("Error fetching school years:", error);
      res.status(500).json({ message: "Failed to fetch school years" });
    }
  });
  app2.post("/api/super-admin/verify-password", requireSuperAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      const user = req.superAdmin;
      const userWithPassword = await storage.getUserWithPassword(user.id);
      if (!userWithPassword) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await comparePassword(password, userWithPassword.password);
      if (isPasswordValid) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });
  app2.post("/api/super-admin/unlock-year", requireSuperAdmin, async (req, res) => {
    try {
      const { schoolId, year, unlock } = req.body;
      if (!schoolId || !year || typeof unlock !== "boolean") {
        return res.status(400).json({ message: "School ID, year, and unlock status are required" });
      }
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      let existingPurchase = purchases.find((p) => p.year === year);
      if (existingPurchase) {
        const updatedPurchase = await storage.updateYearPurchase(existingPurchase.id, unlock, unlock);
        let deletedCartItems = 0;
        if (unlock) {
          deletedCartItems = await storage.deleteCartItemsBySchoolAndYear(schoolId, year);
        }
        await storage.logAdminAction(
          req.superAdmin.id,
          unlock ? "unlocked_year" : "locked_year",
          "year_purchase",
          existingPurchase.id,
          {
            schoolName: school.name,
            schoolId,
            year,
            previousStatus: existingPurchase.purchased,
            newStatus: unlock,
            deletedCartItems: unlock ? deletedCartItems : 0
          }
        );
        res.json({
          message: `Year ${year} ${unlock ? "unlocked" : "locked"} for ${school.name}`,
          purchase: updatedPurchase
        });
      } else {
        const newPurchase = await storage.createYearPurchase({
          schoolId,
          year,
          purchased: unlock,
          purchaseDate: unlock ? /* @__PURE__ */ new Date() : null,
          price: "14.99",
          unlockedByAdmin: unlock
        });
        let deletedCartItems = 0;
        if (unlock) {
          deletedCartItems = await storage.deleteCartItemsBySchoolAndYear(schoolId, year);
        }
        await storage.logAdminAction(
          req.superAdmin.id,
          unlock ? "unlocked_year" : "locked_year",
          "year_purchase",
          newPurchase.id,
          {
            schoolName: school.name,
            schoolId,
            year,
            newStatus: unlock,
            deletedCartItems: unlock ? deletedCartItems : 0
          }
        );
        res.json({
          message: `Year ${year} ${unlock ? "unlocked" : "locked"} for ${school.name}`,
          purchase: newPurchase
        });
      }
    } catch (error) {
      console.error("Error toggling year lock:", error);
      res.status(500).json({ message: "Failed to update year status" });
    }
  });
  app2.post("/api/schools/:schoolId/create-subaccount", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { bankAccountNumber, bankCode } = req.body;
      if (!bankAccountNumber || !bankCode) {
        return res.status(400).json({
          status: false,
          message: "Bank account number and bank code are required"
        });
      }
      const school = await storage.getSchoolById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: false,
          message: "School not found"
        });
      }
      const bankVerificationResponse = await fetch(`https://api.paystack.co/bank/resolve?account_number=${bankAccountNumber}&bank_code=${bankCode}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const bankVerificationResult = await bankVerificationResponse.json();
      if (!bankVerificationResult.status) {
        return res.status(400).json({
          status: false,
          message: "Bank account verification failed",
          error: bankVerificationResult.message
        });
      }
      const subaccountData = {
        business_name: school.name,
        settlement_bank: bankCode,
        account_number: bankAccountNumber,
        percentage_charge: 80,
        // School gets 80%
        description: `Revenue sharing subaccount for ${school.name}`,
        primary_contact_email: school.email,
        primary_contact_name: school.name,
        primary_contact_phone: null,
        metadata: {
          school_id: schoolId,
          account_holder_name: bankVerificationResult.data.account_name
        }
      };
      const paystackResponse = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subaccountData)
      });
      const paystackResult = await paystackResponse.json();
      if (!paystackResult.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to create subaccount with Paystack",
          error: paystackResult.message
        });
      }
      const updatedSchool = await storage.updateSchoolSubaccount(
        schoolId,
        paystackResult.data.subaccount_code,
        bankAccountNumber,
        bankCode,
        "active"
      );
      res.json({
        status: true,
        message: "Subaccount created successfully",
        data: {
          subaccount_code: paystackResult.data.subaccount_code,
          account_holder_name: bankVerificationResult.data.account_name,
          bank_name: bankVerificationResult.data.bank_name,
          revenue_share_percentage: 80
        }
      });
    } catch (error) {
      console.error("Error creating subaccount:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while creating subaccount"
      });
    }
  });
  app2.get("/api/banks", async (req, res) => {
    try {
      const response = await fetch("https://api.paystack.co/bank", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const result = await response.json();
      if (!result.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to fetch banks from Paystack",
          error: result.message
        });
      }
      res.json({
        status: true,
        data: result.data.map((bank) => ({
          name: bank.name,
          code: bank.code,
          slug: bank.slug
        }))
      });
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while fetching banks"
      });
    }
  });
  app2.post("/api/banks/verify-preview", async (req, res) => {
    try {
      const { accountNumber, bankCode } = req.body;
      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          status: false,
          message: "Bank account number and bank code are required"
        });
      }
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const result = await response.json();
      if (!result.status) {
        return res.status(400).json({
          status: false,
          message: result.message || "Unable to verify bank account"
        });
      }
      res.json({
        status: true,
        data: {
          account_name: result.data.account_name,
          bank_name: result.data.bank_name,
          account_number: accountNumber
        }
      });
    } catch (error) {
      console.error("Error verifying bank account:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while verifying bank account"
      });
    }
  });
  app2.post("/api/schools/:schoolId/update-account", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { bankAccountNumber, bankCode } = req.body;
      if (!bankAccountNumber || !bankCode) {
        return res.status(400).json({
          status: false,
          message: "Bank account number and bank code are required"
        });
      }
      const bankVerificationResponse = await fetch(`https://api.paystack.co/bank/resolve?account_number=${bankAccountNumber}&bank_code=${bankCode}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const bankVerificationResult = await bankVerificationResponse.json();
      if (!bankVerificationResult.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to verify bank account",
          error: bankVerificationResult.message
        });
      }
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({
          status: false,
          message: "School not found"
        });
      }
      if (!school.paystackSubaccountCode) {
        return res.status(400).json({
          status: false,
          message: "No existing revenue sharing setup found. Please set up revenue sharing first."
        });
      }
      const updateResponse = await fetch(`https://api.paystack.co/subaccount/${school.paystackSubaccountCode}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: bankAccountNumber
        })
      });
      const updateResult = await updateResponse.json();
      if (!updateResult.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to update account with Paystack",
          error: updateResult.message
        });
      }
      const updatedSchool = await storage.updateSchoolSubaccount(
        schoolId,
        school.paystackSubaccountCode,
        bankAccountNumber,
        bankCode,
        "active"
      );
      res.json({
        status: true,
        message: "Bank account updated successfully",
        data: {
          account_holder_name: bankVerificationResult.data.account_name,
          bank_name: bankVerificationResult.data.bank_name,
          account_number: bankAccountNumber
        }
      });
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while updating bank account"
      });
    }
  });
  app2.post("/api/payments/initialize", async (req, res) => {
    try {
      const { email, firstName, lastName, phone, amount, cartItems: cartItems2, userId } = req.body;
      if (!email || !firstName || !phone || !amount || !cartItems2 || !userId) {
        return res.status(400).json({
          status: false,
          message: "Missing required fields: email, firstName, phone, amount, cartItems, userId"
        });
      }
      const reference = `yearbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalAmountKobo = Math.round(amount * 100);
      const platformPercentage = 20;
      const schoolPercentage = 80;
      const platformAmount = Math.round(totalAmountKobo * (platformPercentage / 100));
      const schoolAmount = totalAmountKobo - platformAmount;
      const schoolId = cartItems2[0]?.schoolId;
      let splitCode = null;
      let subaccountCode = null;
      if (schoolId) {
        const school = await storage.getSchoolById(schoolId);
        if (school && school.paystackSubaccountCode) {
          subaccountCode = school.paystackSubaccountCode;
        }
      }
      const formatPhoneForPaystack = (phoneNumber) => {
        if (!phoneNumber) return "";
        let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
        if (cleaned.startsWith("+")) {
          cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("0") && cleaned.length >= 10) {
          return "+234" + cleaned.substring(1);
        }
        if (cleaned.startsWith("234") && cleaned.length >= 13) {
          return "+" + cleaned;
        }
        if (/^[789]/.test(cleaned) && cleaned.length >= 9 && cleaned.length <= 10) {
          return "+234" + cleaned;
        }
        return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
      };
      const cleanFirstName = (firstName || "").trim();
      const cleanLastName = (lastName || "").trim();
      const paystackFirstName = cleanFirstName || "Customer";
      const paystackLastName = cleanLastName || "Account";
      const paystackData = {
        email,
        first_name: paystackFirstName,
        last_name: paystackLastName,
        phone: formatPhoneForPaystack(phone),
        amount: totalAmountKobo,
        reference,
        currency: "NGN",
        callback_url: `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}/api/payments/verify/${reference}`,
        metadata: {
          cart_items: cartItems2.length,
          user_id: userId,
          school_id: schoolId,
          platform_amount: platformAmount,
          school_amount: schoolAmount,
          items: cartItems2.map((item) => ({
            school_id: item.schoolId,
            year: item.year,
            price: item.price
          }))
        },
        ...subaccountCode && {
          subaccount: subaccountCode,
          transaction_charge: platformAmount,
          bearer: "subaccount"
        }
      };
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paystackData)
      });
      const paystackResult = await paystackResponse.json();
      if (!paystackResult.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to initialize payment with Paystack",
          error: paystackResult.message
        });
      }
      await storage.createPaymentRecord({
        reference,
        email,
        amount: totalAmountKobo,
        userId,
        status: "pending",
        cartItems: JSON.stringify(cartItems2),
        paystackData: JSON.stringify(paystackResult.data),
        schoolId,
        splitCode,
        platformAmount,
        schoolAmount,
        splitStatus: "pending"
      });
      res.json({
        status: true,
        message: "Payment initialized successfully",
        data: {
          authorization_url: paystackResult.data.authorization_url,
          access_code: paystackResult.data.access_code,
          reference: paystackResult.data.reference
        }
      });
    } catch (error) {
      console.error("Error initializing payment:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while initializing payment"
      });
    }
  });
  app2.get("/api/payments/verify/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({
          status: false,
          message: "Payment reference is required"
        });
      }
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const paystackResult = await paystackResponse.json();
      if (!paystackResult.status) {
        return res.status(400).json({
          status: false,
          message: "Failed to verify payment with Paystack",
          error: paystackResult.message
        });
      }
      const paymentData = paystackResult.data;
      const paymentRecord = await storage.getPaymentByReference(reference);
      if (!paymentRecord) {
        return res.status(404).json({
          status: false,
          message: "Payment record not found"
        });
      }
      if (paymentData.status === "success" && paymentData.gateway_response === "Successful") {
        await storage.updatePaymentStatus(reference, "success");
        const cartItems2 = JSON.parse(paymentRecord.cartItems);
        const userId = paymentRecord.userId;
        const user = await storage.getUserById(userId);
        for (const item of cartItems2) {
          if (user?.userType === "school") {
            await storage.createYearPurchase({
              schoolId: item.schoolId,
              year: item.year,
              purchased: true,
              price: item.price || "4.99",
              purchaseDate: /* @__PURE__ */ new Date(),
              paymentReference: reference
            });
            if (item.orientation && item.uploadType) {
              const existingYearbook = await storage.getYearbookBySchoolAndYear(item.schoolId, item.year);
              if (!existingYearbook) {
                await storage.createYearbook({
                  schoolId: item.schoolId,
                  year: item.year,
                  title: `${item.year} Yearbook`,
                  isPublished: false,
                  isInitialized: true,
                  // Mark as initialized since config is set
                  orientation: item.orientation,
                  uploadType: item.uploadType
                });
              } else {
                await storage.updateYearbook(existingYearbook.id, {
                  orientation: item.orientation,
                  uploadType: item.uploadType,
                  isInitialized: true
                });
              }
            }
          } else {
            await storage.createViewerYearPurchase({
              userId,
              schoolId: item.schoolId,
              year: item.year,
              purchased: true,
              price: item.price || "4.99",
              purchaseDate: /* @__PURE__ */ new Date(),
              paymentReference: reference
            });
          }
        }
        await storage.clearUserCart(userId);
        res.redirect(`https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}/cart?payment=success&reference=${reference}`);
      } else {
        await storage.updatePaymentStatus(reference, "failed");
        res.redirect(`https://${process.env.REPLIT_DEV_DOMAIN || "localhost:5000"}/cart?payment=failed&reference=${reference}`);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while verifying payment"
      });
    }
  });
  app2.get("/api/payments/status/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const paymentRecord = await storage.getPaymentByReference(reference);
      if (!paymentRecord) {
        return res.status(404).json({
          status: false,
          message: "Payment record not found"
        });
      }
      res.json({
        status: true,
        data: {
          reference: paymentRecord.reference,
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          email: paymentRecord.email
        }
      });
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error while getting payment status"
      });
    }
  });
  app2.post("/api/yearbook-codes/create", async (req, res) => {
    const { schoolId, year, count } = req.body;
    if (!schoolId || !year || !count) {
      return res.status(400).json({ message: "School ID, year, and count are required" });
    }
    if (count < 1 || count > 100) {
      return res.status(400).json({ message: "Count must be between 1 and 100" });
    }
    try {
      const yearbook = await storage.getPublishedYearbook(schoolId, year);
      if (!yearbook) {
        return res.status(400).json({ message: "Published yearbook not found for this year" });
      }
      const codes = await storage.createYearbookCodes(schoolId, year, count);
      res.json({ codes, message: `${count} codes generated successfully` });
    } catch (error) {
      console.error("Error creating yearbook codes:", error);
      res.status(500).json({ message: "Failed to generate codes" });
    }
  });
  app2.get("/api/yearbook-codes/school/:schoolId", async (req, res) => {
    const { schoolId } = req.params;
    try {
      const codes = await storage.getYearbookCodesBySchool(schoolId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching yearbook codes:", error);
      res.status(500).json({ message: "Failed to fetch codes" });
    }
  });
  app2.post("/api/yearbook-codes/redeem", async (req, res) => {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ message: "Code and user ID are required" });
    }
    try {
      const result = await storage.redeemYearbookCode(code, userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error redeeming yearbook code:", error);
      res.status(500).json({ message: "Failed to redeem code" });
    }
  });
  app2.get("/api/yearbook-access/:userId/:schoolId/:year", async (req, res) => {
    const { userId, schoolId, year } = req.params;
    const validYear = validateYear(year);
    if (validYear === null) {
      return res.status(400).json({ error: "Invalid or missing year parameter" });
    }
    try {
      const hasAccess = await storage.checkUserYearbookAccess(userId, schoolId, validYear);
      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking yearbook access:", error);
      res.status(500).json({ message: "Failed to check access" });
    }
  });
  app2.delete("/api/yearbook-codes/:codeId", async (req, res) => {
    const { codeId } = req.params;
    try {
      await storage.deleteYearbookCode(codeId);
      res.json({ message: "Code deleted successfully" });
    } catch (error) {
      console.error("Error deleting yearbook code:", error);
      res.status(500).json({ message: "Failed to delete code" });
    }
  });
  app2.delete("/api/yearbook-codes/school/:schoolId/year/:year", async (req, res) => {
    const { schoolId, year } = req.params;
    const validYear = validateYear(year);
    if (validYear === null) {
      return res.status(400).json({ error: "Invalid or missing year parameter" });
    }
    try {
      await storage.deleteAllYearbookCodes(schoolId, validYear);
      res.json({ message: "All codes deleted successfully" });
    } catch (error) {
      console.error("Error deleting all yearbook codes:", error);
      res.status(500).json({ message: "Failed to delete codes" });
    }
  });
  app2.get("/api/payment-history/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const paymentHistory = await storage.getViewerPaymentHistory(userId);
      res.json(paymentHistory);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  app2.get("/api/secure-image/accreditation/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const userId = req.headers["x-user-id"] || req.query.userId;
      console.log(`\u{1F510} Secure accreditation document request: ${filename}, userId: ${userId}`);
      if (!userId) {
        console.log("\u274C No userId provided for accreditation document access");
        return res.status(401).json({ message: "Authentication required to access accreditation documents" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log(`\u274C Invalid user ID: ${userId}`);
        return res.status(401).json({ message: "Invalid user" });
      }
      if (user.userType !== "super_admin") {
        console.log(`\u274C Access denied: ${user.email} (${user.userType}) is not a super-admin`);
        return res.status(403).json({ message: "Access denied. Super-admin privileges required." });
      }
      console.log(`\u2705 Super-admin access granted: ${user.email}`);
      const filePath = path.join(import.meta.dirname, "..", "public", "uploads", "accreditation", filename);
      if (!fsSync.existsSync(filePath)) {
        console.log(`\u274C Accreditation document not found: ${filePath}`);
        return res.status(404).json({ message: "Accreditation document not found" });
      }
      console.log(`\u{1F4C4} Serving accreditation document: ${filename}`);
      res.sendFile(filePath);
    } catch (error) {
      console.error("\u274C Error serving accreditation document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/secure-image/yearbooks/:directory/:filename", async (req, res) => {
    try {
      const { directory, filename } = req.params;
      const userId = req.headers["x-user-id"] || req.query.userId;
      console.log(`\u{1F510} Secure yearbook image request: ${directory}/${filename}, userId: ${userId}`);
      if (!userId) {
        console.log("\u274C No userId provided for yearbook image access");
        return res.status(401).json({ message: "Authentication required to access images" });
      }
      const normalizedDirectory = path.normalize(directory).replace(/^(\.\.[\/\\])+/, "");
      const normalizedFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, "");
      if (normalizedDirectory.includes("..") || normalizedFilename.includes("..") || normalizedDirectory.includes("/") || normalizedFilename.includes("/") || normalizedDirectory.includes("\\") || normalizedFilename.includes("\\")) {
        console.log(`\u274C Path traversal attempt blocked: ${directory}/${filename}`);
        return res.status(403).json({ message: "Invalid file path" });
      }
      const uploadsDir = path.join(import.meta.dirname, "..", "public", "uploads", "yearbooks");
      const requestedPath = path.join(uploadsDir, normalizedDirectory, normalizedFilename);
      const resolvedPath = path.resolve(requestedPath);
      const resolvedUploadsDir = path.resolve(uploadsDir);
      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        console.log(`\u274C Path escape attempt blocked: ${resolvedPath} vs ${resolvedUploadsDir}`);
        return res.status(403).json({ message: "Access denied - path outside allowed directory" });
      }
      if (fsSync.existsSync(resolvedPath)) {
        console.log(`\u2705 Secure file access granted: ${normalizedDirectory}/${normalizedFilename}`);
        res.sendFile(resolvedPath);
        return;
      }
      console.log(`\u274C File not found: ${resolvedPath}`);
      return res.status(404).json({ message: "Image not found" });
    } catch (error) {
      console.error("\u274C Error serving yearbook image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/secure-image/yearbooks/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const userId = req.headers["x-user-id"] || req.query.userId;
      console.log(`\u{1F510} Secure yearbook image request: ${filename}, userId: ${userId}`);
      if (!userId) {
        console.log("\u274C No userId provided for yearbook image access");
        return res.status(401).json({ message: "Authentication required to access images" });
      }
      let page = null;
      let yearbook = null;
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log(`\u274C Invalid user ID: ${userId}`);
        return res.status(401).json({ message: "Invalid user" });
      }
      console.log(`\u{1F4CB} User found: ${user.email} (${user.userType})`);
      if (user.userType === "school" && user.schoolId) {
        const schoolYearbooks = await storage.getYearbooksBySchool(user.schoolId);
        console.log(`\u{1F3EB} School has ${schoolYearbooks.length} yearbooks`);
        for (const yb of schoolYearbooks) {
          const yearbookPages2 = await storage.getYearbookPages(yb.id);
          console.log(`\u{1F4DA} Yearbook ${yb.title} (${yb.year}) has ${yearbookPages2.length} pages`);
          for (const p of yearbookPages2) {
            console.log(`\u{1F50D} Checking page ${p.pageType}: ${p.imageUrl}`);
            if (p.imageUrl && p.imageUrl.includes(filename)) {
              console.log(`\u2705 MATCH FOUND!`);
              page = p;
              yearbook = yb;
              break;
            }
          }
          if (page) break;
        }
      } else if (user.userType === "viewer") {
        console.log(`\u{1F440} Viewer account - searching all yearbooks for ${filename}`);
        const allSchools = await storage.getSchools();
        console.log(`\u{1F50D} Searching across ${allSchools.length} schools for yearbook image`);
        outerLoop: for (const school of allSchools) {
          const schoolYearbooks = await storage.getYearbooksBySchool(school.id);
          console.log(`\u{1F3EB} School ${school.name} has ${schoolYearbooks.length} yearbooks`);
          for (const yb of schoolYearbooks) {
            const yearbookPages2 = await storage.getYearbookPages(yb.id);
            console.log(`\u{1F4DA} Yearbook ${yb.title} (${yb.year}) has ${yearbookPages2.length} pages`);
            for (const p of yearbookPages2) {
              console.log(`\u{1F50D} Checking page ${p.pageType}: ${p.imageUrl}`);
              if (p.imageUrl && p.imageUrl.includes(filename)) {
                console.log(`\u2705 MATCH FOUND for viewer!`);
                page = p;
                yearbook = yb;
                break outerLoop;
              }
            }
          }
        }
      }
      if (!page) {
        console.log(`\u274C Page not found for filename: ${filename}`);
        console.log(`\u{1F4CB} Debug info: user.userType=${user.userType}, user.schoolId=${user.schoolId}`);
        return res.status(404).json({ message: "Image not found" });
      }
      if (!yearbook) {
        console.log(`\u274C Yearbook not found`);
        return res.status(404).json({ message: "Yearbook not found" });
      }
      console.log(`\u{1F4CB} Authorization check for ${filename}:`);
      console.log(`   User: ${user.email} (${user.userType})`);
      console.log(`   User schoolId: ${user.schoolId}`);
      console.log(`   Yearbook schoolId: ${yearbook.schoolId}`);
      console.log(`   Yearbook: ${yearbook.title} (${yearbook.year})`);
      if (user.userType === "super_admin") {
        console.log(`\u2705 Super admin access granted for ${user.email}`);
        return await serveSecureFile(res, `public/uploads/yearbooks/${filename}`);
      }
      if (user.userType === "school" && user.schoolId === yearbook.schoolId) {
        console.log(`\u2705 School admin access granted for ${user.email}`);
        return await serveSecureFile(res, `public/uploads/yearbooks/${filename}`);
      }
      if (user.userType === "viewer") {
        const purchases = await storage.getAllViewerYearPurchases(userId);
        const hasPurchased = purchases.some(
          (p) => p.schoolId === yearbook.schoolId && p.year === yearbook.year && p.purchased
        );
        console.log(`\u{1F4CA} Viewer purchase check for ${user.email}:`);
        console.log(`   Has purchased: ${hasPurchased}`);
        console.log(`   Purchases: ${JSON.stringify(purchases.map((p) => ({ schoolId: p.schoolId, year: p.year, purchased: p.purchased })))}`);
        if (!hasPurchased) {
          console.log(`\u274C Viewer access denied - no purchase found`);
          return res.status(403).json({
            message: "You must purchase this yearbook to access its pages"
          });
        }
        console.log(`\u2705 Viewer access granted for ${user.email}`);
        return await serveSecureFile(res, `public/uploads/yearbooks/${filename}`);
      }
      console.log(`\u274C Access denied for user type: ${user.userType}`);
      return res.status(403).json({ message: "Access denied" });
    } catch (error) {
      console.error("Error serving secure yearbook image:", error);
      return res.status(500).json({ message: "Failed to serve image" });
    }
  });
  async function serveSecureFile(res, filePath) {
    const fsSync2 = await import("fs");
    const fullPath = path.resolve(filePath);
    console.log(`\u{1F4C1} Serving secure file: ${fullPath}`);
    if (!fsSync2.existsSync(fullPath) || !fullPath.includes("uploads")) {
      console.log(`\u274C File not found or not in uploads: ${fullPath}`);
      return res.status(404).json({ message: "File not found" });
    }
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo"
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    console.log(`\u2705 Serving file with mime type: ${mimeType}`);
    const stream = fsSync2.createReadStream(fullPath);
    stream.pipe(res);
    stream.on("error", (error) => {
      console.error("\u274C File stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to read file" });
      }
    });
  }
  app2.get("/api/schools/:schoolId/payment-history", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const purchases = await storage.getYearPurchasesBySchool(schoolId);
      const paymentHistory = purchases.filter((p) => p.purchased && !p.unlockedByAdmin).map((p) => ({
        id: p.id,
        year: p.year,
        amount: parseFloat(p.price || "0"),
        currency: "USD",
        // Base currency
        date: p.purchaseDate,
        type: "purchase",
        description: `Year ${p.year} Access`,
        reference: p.paymentReference
      })).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      res.json(paymentHistory);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  app2.get("/api/schools/:schoolId/sales-history", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = authHeader.substring(7);
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "school" && user.userType !== "super_admin") {
        return res.status(403).json({ message: "School admin privileges required" });
      }
      if (user.userType === "school") {
        const school = await storage.getSchoolByAdminUserId(userId);
        if (!school || school.id !== schoolId) {
          return res.status(403).json({ message: "Access denied for this school" });
        }
      }
      const allPayments = await storage.getPaymentRecordsBySchool(schoolId);
      const salesHistory = allPayments.filter((p) => p.status === "success" && p.schoolAmount).map((p) => ({
        id: p.id,
        amount: (p.schoolAmount || 0) / 100,
        // Convert from kobo to naira
        platformAmount: (p.platformAmount || 0) / 100,
        totalAmount: (p.amount || 0) / 100,
        currency: "NGN",
        // Paystack payments are in Nigerian Naira
        date: p.createdAt,
        type: "sale",
        description: "Yearbook Access Sale",
        reference: p.reference,
        buyerEmail: p.email,
        splitStatus: p.splitStatus
      })).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      res.json(salesHistory);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      res.status(500).json({ message: "Failed to fetch sales history" });
    }
  });
  app2.post("/api/test-email", async (req, res) => {
    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ message: "Email recipient (to) is required" });
      }
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Waibuk Email Test</h1>
          <p>This is a test email from Waibuk's automated system.</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you received this email, the email system is working correctly.
          </p>
        </div>
      `;
      const result = await sendEmail(
        to,
        "Waibuk Email System Test",
        htmlContent
      );
      if (result.success) {
        res.json({
          success: true,
          message: "Test email sent successfully",
          recipient: to
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Test email endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(process.cwd(), "client", "src"),
      "@shared": path2.resolve(process.cwd(), "shared"),
      "@assets": path2.resolve(process.cwd(), "attached_assets")
    }
  },
  root: path2.resolve(process.cwd(), "client"),
  build: {
    outDir: path2.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  define: {
    "import.meta.env.VITE_PAYSTACK_PUBLIC_KEY": JSON.stringify(process.env.PAYSTACK_PUBLIC_KEY)
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(process.cwd(), "client", "index.html");
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(process.cwd(), "dist/public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use((req, res, next) => {
    if (req.path.includes("/uploads/yearbooks/") || req.path.includes("/uploads/accreditation/")) {
      return res.status(403).json({
        message: "Direct access to secure content is not allowed. Please use secure image endpoints."
      });
    }
    next();
  });
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/initialize-database.ts
import { eq as eq2 } from "drizzle-orm";

// server/database-connection.ts
import { drizzle as drizzle3 } from "drizzle-orm/postgres-js";
import postgres2 from "postgres";
import { sql as sql3 } from "drizzle-orm";
function createDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  let connectionString3 = process.env.DATABASE_URL;
  const urlParts = connectionString3.split("@");
  const safeUrl = urlParts.length > 1 ? `***@${urlParts[1]}` : "DATABASE_URL_SET";
  console.log(`\u{1F4E1} Attempting connection to: ${safeUrl}`);
  try {
    const queryClient2 = postgres2(connectionString3);
    const db3 = drizzle3(queryClient2, { schema: schema_exports });
    return db3;
  } catch (error) {
    console.error("\u274C Failed to create database connection:", error);
    throw error;
  }
}
async function testDatabaseConnection() {
  try {
    const db3 = createDatabaseConnection();
    console.log("\u{1F50D} Testing database connectivity...");
    await db3.execute(sql3`SELECT 1 as test`);
    console.log("\u2705 Database connection test successful");
    return db3;
  } catch (error) {
    console.error("\u274C Database connection test failed:");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.message.includes("ECONNREFUSED")) {
        console.error("\u{1F4A1} Connection refused - this usually means:");
        console.error("   1. Database service is not running");
        console.error("   2. Incorrect DATABASE_URL format");
        console.error("   3. Network/firewall blocking connection");
      }
      if (error.message.includes("fetch failed")) {
        console.error("\u{1F4A1} Fetch failed - this might mean:");
        console.error("   1. DATABASE_URL format is incorrect");
        console.error("   2. SSL/TLS configuration issue");
        console.error("   3. Network connectivity problem");
      }
    }
    throw error;
  }
}

// server/render-fallback.ts
async function initializeDatabaseFallback() {
  try {
    console.log("\u{1F504} Attempting fallback database initialization...");
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
    console.log("\u{1F4E1} Testing basic PostgreSQL connection...");
    const client2 = await pool.connect();
    await client2.query("SELECT 1");
    console.log("\u2705 Basic PostgreSQL connection successful");
    const tableCheck = await client2.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    if (!tableCheck.rows[0].exists) {
      console.log("\u274C Users table does not exist");
      console.log("\u{1F4A1} Run 'npm run db:push' to create tables first");
      client2.release();
      pool.end();
      return false;
    }
    const userCount = await client2.query("SELECT COUNT(*) FROM users");
    const count = parseInt(userCount.rows[0].count);
    if (count === 0) {
      console.log("\u{1F4DD} No users found, creating super-admin with basic SQL...");
      const plainPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";
      const hashedPassword = await hashPassword(plainPassword);
      await client2.query(`
        INSERT INTO users (username, password, user_type, role, first_name, last_name, full_name, date_of_birth, email)
        VALUES ('admin', $1, 'super_admin', 'super_admin', 'Super', 'Admin', 'Super Admin', '1990-01-01', 'admin@yearbook.com')
      `, [hashedPassword]);
      console.log("\u2705 Super-admin created successfully with bcrypt-hashed password");
      console.log("   Username: admin");
      console.log("   Password: [SECURED - bcrypt hashed]");
    } else {
      console.log(`\u2705 Found ${count} existing users, skipping super-admin creation`);
    }
    client2.release();
    await pool.end();
    console.log("\u2705 Fallback database initialization complete");
    return true;
  } catch (error) {
    console.error("\u274C Fallback database initialization failed:", error);
    return false;
  }
}

// server/initialize-database.ts
async function createTestAccountsIfNeeded(db3) {
  try {
    const existingTestSchool = await db3.select().from(users).where(eq2(users.username, "test_school")).limit(1);
    const existingTestViewer = await db3.select().from(users).where(eq2(users.username, "test_viewer")).limit(1);
    if (existingTestSchool.length > 0 && existingTestViewer.length > 0) {
      console.log("\u2705 Test accounts already exist, skipping creation");
      return;
    }
    console.log("\u{1F4DD} Creating test accounts...");
    if (existingTestSchool.length === 0) {
      const testSchoolResult = await db3.insert(schools).values({
        name: "Albesta Academy",
        address: "123 Education Street",
        country: "United States",
        state: "California",
        city: "Test City",
        email: "contact@testschool.edu",
        phoneNumber: "+15551234567",
        website: "https://testschool.edu",
        yearFounded: 1985,
        registrationNumber: "REG-12345-TEST",
        approvalStatus: "approved",
        activationCode: "TEST-ACT-123"
      }).returning();
      const testSchoolId = testSchoolResult[0].id;
      const plainPassword = process.env.TEST_SCHOOL_PASSWORD || "12345";
      const hashedPassword = await hashPassword(plainPassword);
      await db3.insert(users).values({
        username: process.env.TEST_SCHOOL_USERNAME || "test_school",
        password: hashedPassword,
        userType: "school",
        firstName: "Test",
        lastName: "Administrator",
        fullName: "Test Administrator",
        dateOfBirth: "1980-01-01",
        email: "admin@testschool.edu",
        phoneNumber: "(1)5551234567",
        schoolId: testSchoolId
      });
    }
    if (existingTestViewer.length === 0) {
      const plainPassword = process.env.TEST_VIEWER_PASSWORD || "12345";
      const hashedPassword = await hashPassword(plainPassword);
      await db3.insert(users).values({
        username: process.env.TEST_VIEWER_USERNAME || "test_viewer",
        password: hashedPassword,
        userType: "viewer",
        firstName: "Test",
        lastName: "Viewer",
        fullName: "Test Viewer",
        dateOfBirth: "1995-01-01",
        email: "viewer@testuser.com",
        phoneNumber: "+15559876543"
      });
    }
    console.log("\u2705 Test accounts created:");
    console.log("   - School: test_school (password: [SECURED])");
    console.log("   - Viewer: test_viewer (password: [SECURED])");
  } catch (error) {
    console.error("\u274C Failed to create test accounts:", error);
  }
}
async function initializeDatabase() {
  try {
    console.log("\u{1F504} Initializing database...");
    try {
      const db3 = await testDatabaseConnection();
      const existingUsers = await db3.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        console.log("\u{1F4DD} Creating default super-admin account...");
        const plainPassword = process.env.SUPER_ADMIN_PASSWORD;
        if (!plainPassword) {
          throw new Error("SUPER_ADMIN_PASSWORD environment variable is required for security. Please set it in your environment.");
        }
        const hashedPassword = await hashPassword(plainPassword);
        await db3.insert(users).values({
          username: "admin",
          password: hashedPassword,
          userType: "super_admin",
          role: "super_admin",
          firstName: "Super",
          lastName: "Admin",
          fullName: "Super Admin",
          // Required field
          dateOfBirth: "1990-01-01",
          email: "admin@yearbook.com"
        });
        console.log("\u2705 Default super-admin created:");
        console.log("   Username: admin");
        console.log("   Password: [SECURED - bcrypt hashed]");
        console.log("   \u2705 Using secure password from environment variables");
      } else {
        console.log("\u2705 Users table already has data, skipping super-admin creation");
      }
      if (process.env.NODE_ENV === "development" || process.env.CREATE_TEST_ACCOUNTS === "true") {
        await createTestAccountsIfNeeded(db3);
      }
      console.log("\u2705 Database initialization complete");
      return;
    } catch (neonError) {
      console.warn("\u26A0\uFE0F  Standard Neon connection failed, trying fallback approach...");
      console.warn("Neon error:", neonError instanceof Error ? neonError.message : neonError);
      const fallbackSuccess = await initializeDatabaseFallback();
      if (fallbackSuccess) {
        console.log("\u2705 Database initialization completed using fallback method");
        return;
      } else {
        throw new Error("Both standard and fallback database initialization methods failed");
      }
    }
  } catch (error) {
    console.error("\u274C Database initialization failed:", error);
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log("\u{1F4A1} Tables don't exist. Run 'npm run db:push' to create them");
      console.log("\u{1F4A1} For Render deployment, ensure your build command includes 'npm run db:push'");
    }
    throw error;
  }
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/public", (req, res, next) => {
  if (req.path.includes("/uploads/yearbooks/") || req.path.includes("/uploads/accreditation/")) {
    return res.status(403).json({
      message: "Direct access to secure content is not allowed. Please use secure image endpoints."
    });
  }
  express2.static("public")(req, res, next);
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.get("/api/alumni-badges/:userId", async (req, res) => {
  const { userId } = req.params;
  const badges = await storage.getAlumniBadgesByUser(userId);
  res.json(badges);
});
(async () => {
  await initializeDatabase();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
