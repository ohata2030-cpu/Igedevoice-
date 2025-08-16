import {
  users,
  posts,
  blogPosts,
  musicTracks,
  datingProfiles,
  conversations,
  messages,
  comments,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type BlogPost,
  type InsertBlogPost,
  type MusicTrack,
  type InsertMusicTrack,
  type DatingProfile,
  type InsertDatingProfile,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Comment,
  type InsertComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Posts operations
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  incrementPostViews(id: string): Promise<void>;
  updatePostLikes(id: string, likes: number, dislikes: number): Promise<void>;

  // Blog posts operations
  getBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, blogPost: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  incrementBlogPostViews(id: string): Promise<void>;
  updateBlogPostLikes(id: string, likes: number, dislikes: number): Promise<void>;

  // Music operations
  getMusicTracks(limit?: number, offset?: number): Promise<MusicTrack[]>;
  getMusicTrackById(id: string): Promise<MusicTrack | undefined>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  incrementTrackPlays(id: string): Promise<void>;
  incrementTrackDownloads(id: string): Promise<void>;

  // Dating operations
  getDatingProfile(userId: string): Promise<DatingProfile | undefined>;
  createDatingProfile(profile: InsertDatingProfile & { userId: string }): Promise<DatingProfile>;
  updateDatingProfile(userId: string, profile: Partial<InsertDatingProfile>): Promise<DatingProfile | undefined>;
  getDatingProfiles(currentUserId: string, limit?: number, offset?: number): Promise<DatingProfile[]>;
  upgradeToPremium(userId: string, expiresAt: Date): Promise<void>;
  
  // Conversation operations
  getConversations(profileId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(participant1Id: string, participant2Id: string): Promise<Conversation | undefined>;
  
  // Message operations
  getMessages(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, readerId: string): Promise<void>;

  // Comment operations
  getComments(postId?: string, blogPostId?: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  approveComment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Posts operations
  async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount > 0;
  }

  async incrementPostViews(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));
  }

  async updatePostLikes(id: string, likes: number, dislikes: number): Promise<void> {
    await db
      .update(posts)
      .set({ likes, dislikes })
      .where(eq(posts.id, id));
  }

  // Blog posts operations
  async getBlogPosts(limit = 20, offset = 0): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return blogPost;
  }

  async createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost> {
    const [newBlogPost] = await db.insert(blogPosts).values(blogPost).returning();
    return newBlogPost;
  }

  async updateBlogPost(id: string, blogPost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set({ ...blogPost, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedBlogPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount > 0;
  }

  async incrementBlogPostViews(id: string): Promise<void> {
    await db
      .update(blogPosts)
      .set({ views: sql`${blogPosts.views} + 1` })
      .where(eq(blogPosts.id, id));
  }

  async updateBlogPostLikes(id: string, likes: number, dislikes: number): Promise<void> {
    await db
      .update(blogPosts)
      .set({ likes, dislikes })
      .where(eq(blogPosts.id, id));
  }

  // Music operations
  async getMusicTracks(limit = 20, offset = 0): Promise<MusicTrack[]> {
    return await db
      .select()
      .from(musicTracks)
      .orderBy(desc(musicTracks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getMusicTrackById(id: string): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track;
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [newTrack] = await db.insert(musicTracks).values(track).returning();
    return newTrack;
  }

  async incrementTrackPlays(id: string): Promise<void> {
    await db
      .update(musicTracks)
      .set({ plays: sql`${musicTracks.plays} + 1` })
      .where(eq(musicTracks.id, id));
  }

  async incrementTrackDownloads(id: string): Promise<void> {
    await db
      .update(musicTracks)
      .set({ downloads: sql`${musicTracks.downloads} + 1` })
      .where(eq(musicTracks.id, id));
  }

  // Dating operations
  async getDatingProfile(userId: string): Promise<DatingProfile | undefined> {
    const [profile] = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));
    return profile;
  }

  async getDatingProfiles(currentUserId: string, limit = 20, offset = 0): Promise<DatingProfile[]> {
    return await db
      .select()
      .from(datingProfiles)
      .where(and(
        eq(datingProfiles.isVisible, true),
        ne(datingProfiles.userId, currentUserId)
      ))
      .orderBy(desc(datingProfiles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createDatingProfile(profile: InsertDatingProfile & { userId: string }): Promise<DatingProfile> {
    const [newProfile] = await db.insert(datingProfiles).values(profile).returning();
    return newProfile;
  }

  async updateDatingProfile(userId: string, profile: Partial<InsertDatingProfile>): Promise<DatingProfile | undefined> {
    const [updatedProfile] = await db
      .update(datingProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(datingProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Conversation operations
  async getConversations(profileId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(or(
        eq(conversations.participant1Id, profileId),
        eq(conversations.participant2Id, profileId)
      ))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async getConversation(participant1Id: string, participant2Id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(or(
        and(
          eq(conversations.participant1Id, participant1Id),
          eq(conversations.participant2Id, participant2Id)
        ),
        and(
          eq(conversations.participant1Id, participant2Id),
          eq(conversations.participant2Id, participant1Id)
        )
      ));
    return conversation;
  }

  // Message operations
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessagesAsRead(conversationId: string, readerId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, readerId),
        eq(messages.read, false)
      ));
  }

  // Comment operations
  async getComments(postId?: string, blogPostId?: string): Promise<Comment[]> {
    let query = db.select().from(comments).where(eq(comments.approved, true));
    
    if (postId) {
      query = query.where(eq(comments.postId, postId));
    } else if (blogPostId) {
      query = query.where(eq(comments.blogPostId, blogPostId));
    }
    
    return await query.orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async approveComment(id: string): Promise<void> {
    await db
      .update(comments)
      .set({ approved: true })
      .where(eq(comments.id, id));
  }

  // Payment operations
  async upgradeToPremium(userId: string, expiresAt: Date): Promise<void> {
    await db
      .update(datingProfiles)
      .set({ 
        membershipType: 'premium',
        premiumExpiresAt: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(datingProfiles.userId, userId));
  }
}

export const storage = new DatabaseStorage();
