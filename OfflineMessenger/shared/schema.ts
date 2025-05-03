import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("student"), // Valeurs possibles: "student", "teacher", "admin"
  position: text("position"), // Poste dans l'école (ex: "Professeur de Physique")
  department: text("department"), // Département académique
  avatar: text("avatar"), // URL ou chemin de l'avatar
  lastSeen: timestamp("last_seen"), // Dernière connexion
  online: boolean("online").default(false), // Statut en ligne
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
  channelMembers: many(channelMembers),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" })
}));

export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  displayName: (schema) => schema.min(1, "Display name is required")
}).omit({ createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Channels table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const channelsRelations = relations(channels, ({ one, many }) => ({
  creator: one(users, {
    fields: [channels.creatorId],
    references: [users.id]
  }),
  members: many(channelMembers),
  messages: many(messages)
}));

export const insertChannelSchema = createInsertSchema(channels, {
  name: (schema) => schema.min(1, "Channel name is required")
}).omit({ id: true });

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;

// Channel members table
export const channelMembers = pgTable("channel_members", {
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull()
}, (t) => ({
  pk: primaryKey(t.channelId, t.userId)
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id]
  }),
  user: one(users, {
    fields: [channelMembers.userId],
    references: [users.id]
  })
}));

export const insertChannelMemberSchema = createInsertSchema(channelMembers);

export type InsertChannelMember = z.infer<typeof insertChannelMemberSchema>;
export type ChannelMember = typeof channelMembers.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id),
  channelId: integer("channel_id").references(() => channels.id),
  fileId: text("file_id").references(() => files.id)
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages"
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id]
  }),
  file: one(files, {
    fields: [messages.fileId],
    references: [files.id]
  })
}));

export const insertMessageSchema = createInsertSchema(messages, {
  content: (schema) => schema.min(1, "Message content is required")
}).omit({ timestamp: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Files table
export const files = pgTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  uploaderId: integer("uploader_id").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  path: text("path") // Local path for offline mode
});

export const filesRelations = relations(files, ({ one, many }) => ({
  uploader: one(users, {
    fields: [files.uploaderId],
    references: [users.id]
  }),
  messages: many(messages)
}));

export const insertFileSchema = createInsertSchema(files, {
  name: (schema) => schema.min(1, "File name is required"),
  type: (schema) => schema.min(1, "File type is required"),
  size: (schema) => schema.min(1, "File size is required")
}).omit({ uploadedAt: true });

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
