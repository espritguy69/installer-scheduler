import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Service orders table - stores all service installation orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull(),
  serviceNumber: varchar("serviceNumber", { length: 100 }),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  serviceType: varchar("serviceType", { length: 100 }),
  salesModiType: varchar("salesModiType", { length: 100 }),
  address: text("address"),
  appointmentDate: varchar("appointmentDate", { length: 50 }),
  appointmentTime: varchar("appointmentTime", { length: 50 }),
  buildingName: varchar("buildingName", { length: 255 }),
  estimatedDuration: int("estimatedDuration").default(60).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "on_the_way", "met_customer", "completed", "rescheduled", "withdrawn"]).default("pending").notNull(),
  rescheduleReason: mysqlEnum("rescheduleReason", ["customer_issue", "building_issue", "network_issue"]),
  rescheduledDate: timestamp("rescheduledDate"),
  rescheduledTime: varchar("rescheduledTime", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Service installers table - stores installer information
 */
export const installers = mysqlTable("installers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  skills: text("skills"), // JSON array of skills
  isActive: int("isActive").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = typeof installers.$inferInsert;

/**
 * Assignments table - links orders to installers with scheduling information
 */
export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  installerId: int("installerId").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  scheduledStartTime: varchar("scheduledStartTime", { length: 5 }).notNull(), // HH:MM format
  scheduledEndTime: varchar("scheduledEndTime", { length: 5 }).notNull(), // HH:MM format
  actualStartTime: timestamp("actualStartTime"),
  actualEndTime: timestamp("actualEndTime"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

/**
 * Daily notes table - stores remarks, incidents, complaints, and follow-ups
 * Persists even after orders are cleared for historical tracking
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  serviceNumber: varchar("serviceNumber", { length: 100 }), // Reference to service number (persists after order deletion)
  orderNumber: varchar("orderNumber", { length: 100 }), // Reference to order number
  customerName: varchar("customerName", { length: 255 }),
  noteType: mysqlEnum("noteType", ["general", "reschedule", "follow_up", "incident", "complaint"]).default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  createdBy: varchar("createdBy", { length: 255 }), // User who created the note
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * Order history table - audit log for tracking all changes made to orders
 * Records who changed what, when, and the before/after values
 */
export const orderHistory = mysqlTable("orderHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(), // Reference to the order that was changed
  userId: int("userId"), // User who made the change (can be null for system changes)
  userName: varchar("userName", { length: 255 }), // User name at time of change
  action: mysqlEnum("action", ["created", "updated", "status_changed"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }), // Which field was changed (null for create action)
  oldValue: text("oldValue"), // Previous value (null for create action)
  newValue: text("newValue"), // New value
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderHistory = typeof orderHistory.$inferSelect;
export type InsertOrderHistory = typeof orderHistory.$inferInsert;
