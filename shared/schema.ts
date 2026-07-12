import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const labels = pgTable("labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageData: text("image_data").notNull(),
  category: text("category").notNull(), // 'person' | 'object'
  detectedObjects: text("detected_objects").array(), // objects detected in the image
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Reminder title is required"),
  scheduledFor: z.coerce.date(),
});

export const insertLabelSchema = createInsertSchema(labels).omit({
  id: true,
  userId: true,
  createdAt: true,
  lastSeenAt: true,
}).extend({
  name: z.string().min(1, "Label name is required"),
  category: z.enum(["person", "object"]),
  imageData: z.string().min(1, "Photo is required"),
  detectedObjects: z.array(z.string()).default([]).nullable().optional(),
});

export const registerUserSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name is required").max(80),
});

export const loginUserSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labels.$inferSelect;
