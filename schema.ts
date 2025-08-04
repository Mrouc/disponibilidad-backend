import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull(),
  availabilityMode: varchar("availability_mode", { enum: ["full_day", "time_slots"] }).default("full_day").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isCreator: boolean("is_creator").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  memberId: varchar("member_id").notNull(),
  selectedDates: jsonb("selected_dates").$type<string[]>().notNull().default([]),
  timeSlots: jsonb("time_slots").$type<Record<string, string[]>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  joinedAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  updatedAt: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

export type Group = typeof groups.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Availability = typeof availability.$inferSelect;

// Relations
export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
  availability: many(availability),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
  availability: many(availability),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  group: one(groups, {
    fields: [availability.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [availability.memberId],
    references: [members.id],
  }),
}));
