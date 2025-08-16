import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content categories
export const contentTypeEnum = pgEnum('content_type', ['news', 'celebrity', 'blog']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const membershipTypeEnum = pgEnum('membership_type', ['basic', 'premium']);
export const relationshipPurposeEnum = pgEnum('relationship_purpose', ['marriage', 'friendship', 'casual', 'hookup']);
export const bodySizeEnum = pgEnum('body_size', ['slim', 'average', 'curvy', 'plus_size']);
export const heightRangeEnum = pgEnum('height_range', ['short', 'average', 'tall', 'very_tall']);
export const complexionEnum = pgEnum('complexion', ['black', 'chocolate', 'fair_complexion']);

// News and celebrity posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  contentType: contentTypeEnum("content_type").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog posts for cultural content
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: varchar("image_url"),
  authorId: varchar("author_id").references(() => users.id),
  authorName: varchar("author_name"),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  readingTime: integer("reading_time"), // in minutes
  category: varchar("category").default('history'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Music tracks
export const musicTracks = pgTable("music_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: varchar("artist").notNull(),
  duration: varchar("duration"), // format: "4:32"
  audioUrl: varchar("audio_url"),
  imageUrl: varchar("image_url"),
  category: varchar("category", { enum: ["gospel", "mainstream"] }).default("mainstream"),
  isTraditional: boolean("is_traditional").default(true),
  plays: integer("plays").default(0),
  downloads: integer("downloads").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dating profiles
export const datingProfiles = pgTable("dating_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  gender: genderEnum("gender").notNull(),
  age: integer("age").notNull(),
  membershipType: membershipTypeEnum("membership_type").default('basic'),
  premiumExpiresAt: timestamp("premium_expires_at"),
  location: varchar("location"),
  bio: text("bio"),
  isVisible: boolean("is_visible").default(true),
  profilePicture: varchar("profile_picture"),
  displayMedia: text("display_media").array(),
  
  // Premium user preferences for matchmaking
  preferredAgeMin: integer("preferred_age_min"),
  preferredAgeMax: integer("preferred_age_max"),
  preferredLocation: varchar("preferred_location"),
  preferredBodySize: bodySizeEnum("preferred_body_size"),
  preferredHeight: heightRangeEnum("preferred_height"),
  preferredComplexion: complexionEnum("preferred_complexion"),
  relationshipPurpose: relationshipPurposeEnum("relationship_purpose"),
  
  // User's own physical attributes
  bodySize: bodySizeEnum("body_size"),
  height: heightRangeEnum("height"),
  complexion: complexionEnum("complexion"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dating conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").references(() => datingProfiles.id).notNull(),
  participant2Id: varchar("participant2_id").references(() => datingProfiles.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dating messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => datingProfiles.id).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments for posts and blog posts
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  authorName: varchar("author_name").notNull(),
  authorEmail: varchar("author_email"),
  postId: varchar("post_id").references(() => posts.id),
  blogPostId: varchar("blog_post_id").references(() => blogPosts.id),
  parentId: varchar("parent_id").references(() => comments.id),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  blogPosts: many(blogPosts),
  musicTracks: many(musicTracks),
  datingProfile: many(datingProfiles),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const datingProfilesRelations = relations(datingProfiles, ({ one, many }) => ({
  user: one(users, { fields: [datingProfiles.userId], references: [users.id] }),
  sentConversations: many(conversations, { relationName: "participant1" }),
  receivedConversations: many(conversations, { relationName: "participant2" }),
  sentMessages: many(messages),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(datingProfiles, { 
    fields: [conversations.participant1Id], 
    references: [datingProfiles.id],
    relationName: "participant1"
  }),
  participant2: one(datingProfiles, { 
    fields: [conversations.participant2Id], 
    references: [datingProfiles.id],
    relationName: "participant2"
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(datingProfiles, { fields: [messages.senderId], references: [datingProfiles.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  blogPost: one(blogPosts, { fields: [comments.blogPostId], references: [blogPosts.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "parentComment" }),
  replies: many(comments, { relationName: "parentComment" }),
}));

// Types and schemas
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true });

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });

export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = typeof musicTracks.$inferInsert;
export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({ id: true, createdAt: true });

export type DatingProfile = typeof datingProfiles.$inferSelect;
export type InsertDatingProfile = typeof datingProfiles.$inferInsert;
export const insertDatingProfileSchema = createInsertSchema(datingProfiles).omit({ 
  id: true, 
  userId: true,
  createdAt: true, 
  updatedAt: true 
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true,
  read: true
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true, 
  createdAt: true,
  approved: true
});
