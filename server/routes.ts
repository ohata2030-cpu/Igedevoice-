import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPostSchema, 
  insertBlogPostSchema, 
  insertMusicTrackSchema,
  insertDatingProfileSchema,
  insertMessageSchema,
  insertCommentSchema
} from "@shared/schema";
import { z } from "zod";
import { paystackService } from "./paystack";
import { PREMIUM_PLAN } from "@shared/subscription";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Posts routes
  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const contentType = req.query.contentType as string;
      
      let posts;
      if (contentType) {
        posts = await storage.getPosts(limit, offset);
        posts = posts.filter(post => post.contentType === contentType);
      } else {
        posts = await storage.getPosts(limit, offset);
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment views
      await storage.incrementPostViews(req.params.id);
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...validatedData,
        authorId: req.user.claims.sub,
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:id/like', async (req, res) => {
    try {
      const { likes, dislikes } = req.body;
      await storage.updatePostLikes(req.params.id, likes, dislikes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating post likes:", error);
      res.status(500).json({ message: "Failed to update likes" });
    }
  });

  // Blog posts routes
  app.get('/api/blog', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const blogPosts = await storage.getBlogPosts(limit, offset);
      res.json(blogPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/:id', async (req, res) => {
    try {
      const blogPost = await storage.getBlogPostById(req.params.id);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Increment views
      await storage.incrementBlogPostViews(req.params.id);
      res.json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/blog', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPost = await storage.createBlogPost({
        ...validatedData,
        authorId: req.user.claims.sub,
      });
      res.status(201).json(blogPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.post('/api/blog/:id/like', async (req, res) => {
    try {
      const { likes, dislikes } = req.body;
      await storage.updateBlogPostLikes(req.params.id, likes, dislikes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating blog post likes:", error);
      res.status(500).json({ message: "Failed to update likes" });
    }
  });

  // Music routes
  app.get('/api/music', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      
      let tracks = await storage.getMusicTracks(limit, offset);
      
      if (category && category !== 'all') {
        tracks = tracks.filter(track => track.category === category);
      }
      
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ message: "Failed to fetch music tracks" });
    }
  });

  app.get('/api/music/:id', async (req, res) => {
    try {
      const track = await storage.getMusicTrackById(req.params.id);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Error fetching track:", error);
      res.status(500).json({ message: "Failed to fetch track" });
    }
  });

  app.post('/api/music', async (req, res) => {
    try {
      const validatedData = insertMusicTrackSchema.parse(req.body);
      const track = await storage.createMusicTrack(validatedData);
      res.status(201).json(track);
    } catch (error) {
      console.error("Error uploading music:", error);
      res.status(500).json({ message: "Failed to upload music" });
    }
  });

  app.post('/api/music/:id/play', async (req, res) => {
    try {
      await storage.incrementTrackPlays(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing plays:", error);
      res.status(500).json({ message: "Failed to increment plays" });
    }
  });

  app.post('/api/music/:id/download', async (req, res) => {
    try {
      await storage.incrementTrackDownloads(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing downloads:", error);
      res.status(500).json({ message: "Failed to increment downloads" });
    }
  });

  // Dating routes
  app.get('/api/dating/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getDatingProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching dating profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/dating/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDatingProfileSchema.parse(req.body);
      
      const profile = await storage.createDatingProfile({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating dating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get('/api/dating/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const profiles = await storage.getDatingProfiles(userId, limit, offset);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching dating profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Payment routes - WORKING PAYSTACK INTEGRATION
  app.post('/api/payment/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      const reference = paystackService.generateReference(userId);
      
      const paymentData = {
        email: user.email,
        amount: PREMIUM_PLAN.price, // ₦2,500 in kobo
        reference,
        metadata: {
          userId,
          subscriptionType: 'premium' as const,
          plan: 'monthly' as const,
        },
      };

      const response = await paystackService.initializeTransaction(paymentData);
      
      if (response.status) {
        res.json({
          success: true,
          authorization_url: response.data.authorization_url,
          reference: response.data.reference,
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: response.message || "Payment initialization failed" 
        });
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to initialize payment" 
      });
    }
  });

  app.post('/api/payment/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ 
          success: false, 
          message: "Payment reference is required" 
        });
      }

      const verification = await paystackService.verifyTransaction(reference);
      
      if (verification.status && verification.data.status === 'success') {
        const userId = verification.data.metadata.userId;
        
        // Calculate premium expiration (1 month from now)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        
        // Upgrade user to premium
        await storage.upgradeToPremium(userId, expiresAt);
        
        res.json({
          success: true,
          message: "Payment verified and premium activated",
          expiresAt,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify payment",
      });
    }
  });

  // Comments routes
  app.get('/api/comments', async (req, res) => {
    try {
      const postId = req.query.postId as string;
      const blogPostId = req.query.blogPostId as string;
      
      const comments = await storage.getComments(postId, blogPostId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Messaging routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getDatingProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Dating profile not found" });
      }
      
      const conversations = await storage.getConversations(profile.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const conversationId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const messages = await storage.getMessages(conversationId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const userId = req.user.claims.sub;
      const profile = await storage.getDatingProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Dating profile not found" });
      }
      
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validatedData,
        conversationId,
        senderId: profile.id,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
