import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  business_unit: text("business_unit"),
  avatar_url: text("avatar_url"),
  created_at: text("created_at").notNull(),
});

// Cases table
export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  case_number: text("case_number").notNull().unique(),
  channel: text("channel").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  sentiment: text("sentiment").notNull(),
  severity: text("severity").notNull(),
  risk_flag: integer("risk_flag", { mode: "boolean" }).default(false),
  needs_review_flag: integer("needs_review_flag", { mode: "boolean" }).default(
    false,
  ),
  business_unit: text("business_unit").notNull(),
  summary: text("summary").notNull(),
  customer_name: text("customer_name"),
  agent_id: text("agent_id"),
  assigned_to: text("assigned_to"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  resolved_at: text("resolved_at"),
  upload_id: text("upload_id"),
});

// Add other tables as needed...
