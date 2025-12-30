import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, decimal } from "drizzle-orm/mysql-core";

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
  
  // Tinfoil credentials
  tinfoilUser: varchar("tinfoilUser", { length: 255 }).unique(),
  tinfoilPass: text("tinfoilPass"),
  
  // User approval status
  isApproved: boolean("isApproved").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Download history table
export const downloadHistory = mysqlTable("downloadHistory", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  files: int("files").default(1),
  size: varchar("size", { length: 50 }),
  folder: varchar("folder", { length: 255 }),
  duration: int("duration"), // in seconds
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  source: mysqlEnum("source", ["magnet", "torrent-file"]).default("magnet"),
});

export type DownloadHistory = typeof downloadHistory.$inferSelect;
export type InsertDownloadHistory = typeof downloadHistory.$inferInsert;

// Game cache table
export const gameCache = mysqlTable("gameCache", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  size: bigint("size", { mode: "number" }),
  name: varchar("name", { length: 255 }).notNull(),
  titleId: varchar("titleId", { length: 50 }),
  version: int("version").default(0),
  filename: varchar("filename", { length: 255 }),
  path: varchar("path", { length: 500 }).unique(),
  indexedAt: timestamp("indexedAt").defaultNow().notNull(),
});

export type GameCache = typeof gameCache.$inferSelect;
export type InsertGameCache = typeof gameCache.$inferInsert;