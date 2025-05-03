import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from "ws";
import { eq } from "drizzle-orm";
import { users, messages, channels, channelMembers } from "@shared/schema";
import { db } from "@db";

// Store connected clients
const clients: Map<number, WebSocket> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Handle authentication and store user connection
    const session = req.headers.cookie?.split(';')
      .find(c => c.trim().startsWith('connect.sid='));
    
    if (session) {
      // In a production app, you would use the session to get the user ID
      // For now, we'll set up listeners for all events
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle message types
          switch (data.type) {
            case 'message':
              // Store message in the database
              if (data.senderId) {
                const messageData = {
                  id: data.id,
                  content: data.content,
                  timestamp: new Date(data.timestamp),
                  senderId: data.senderId,
                  recipientId: data.recipientId,
                  channelId: data.channelId,
                  fileId: data.fileId
                };
                
                await storage.createMessage(messageData);
                
                // Forward to relevant clients
                if (data.channelId) {
                  // Get channel members
                  const members = await storage.getChannelMembers(data.channelId);
                  
                  // Forward to all connected members except sender
                  members.forEach(member => {
                    const client = clients.get(member.userId);
                    if (client && client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify(data));
                    }
                  });
                } else if (data.recipientId) {
                  // Direct message - forward to recipient
                  const recipientWs = clients.get(data.recipientId);
                  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    recipientWs.send(JSON.stringify(data));
                  }
                }
              }
              break;
              
            case 'typing':
              // Forward typing indicator
              if (data.channelId) {
                // Get channel members
                const members = await storage.getChannelMembers(data.channelId);
                
                // Forward to all connected members except sender
                members.forEach(member => {
                  const client = clients.get(member.userId);
                  if (client && client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                  }
                });
              } else if (data.recipientId) {
                // Direct message - forward to recipient
                const recipientWs = clients.get(data.recipientId);
                if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                  recipientWs.send(JSON.stringify(data));
                }
              }
              break;
              
            case 'file':
              // Handle file message
              console.log('File message received', data.fileId);
              // The file itself is stored in IndexedDB and only a reference is sent
              // Create a message that contains the file reference
              if (data.senderId) {
                const messageData = {
                  id: data.id || Date.now().toString(),
                  content: data.comment || `Shared a file: ${data.fileName}`,
                  timestamp: new Date(data.timestamp),
                  senderId: data.senderId,
                  recipientId: data.recipientId,
                  channelId: data.channelId,
                  fileId: data.fileId
                };
                
                await storage.createMessage(messageData);
                
                // Forward to relevant clients
                if (data.channelId) {
                  // Get channel members
                  const members = await storage.getChannelMembers(data.channelId);
                  
                  // Forward to all connected members except sender
                  members.forEach(member => {
                    const client = clients.get(member.userId);
                    if (client && client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'message',
                        ...messageData
                      }));
                    }
                  });
                } else if (data.recipientId) {
                  // Direct message - forward to recipient
                  const recipientWs = clients.get(data.recipientId);
                  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    recipientWs.send(JSON.stringify({
                      type: 'message',
                      ...messageData
                    }));
                  }
                }
              }
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        // Remove client from the map
        clients.forEach((client, userId) => {
          if (client === ws) {
            clients.delete(userId);
            console.log(`User ${userId} disconnected`);
          }
        });
      });
    }
  });
  
  // API routes
  
  // Get all channels
  app.get('/api/channels', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (err) {
      console.error('Error fetching channels:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get channels for a user
  app.get('/api/channels/user', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userChannels = await storage.getChannelsByUserId(req.user.id);
      res.json(userChannels);
    } catch (err) {
      console.error('Error fetching user channels:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create a new channel
  app.post('/api/channels', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { name, description, isPublic } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Channel name is required' });
      }
      
      // Create channel
      const channel = await storage.createChannel({
        name,
        description: description || '',
        isPublic: isPublic !== false,
        creatorId: req.user.id,
        createdAt: new Date()
      });
      
      // Add creator as a member
      await storage.addMemberToChannel({
        channelId: channel.id,
        userId: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      });
      
      // Add other members if provided
      const { memberIds } = req.body;
      if (memberIds && Array.isArray(memberIds)) {
        for (const memberId of memberIds) {
          if (memberId !== req.user.id) {
            await storage.addMemberToChannel({
              channelId: channel.id,
              userId: memberId,
              role: 'member',
              joinedAt: new Date()
            });
          }
        }
      }
      
      res.status(201).json(channel);
    } catch (err) {
      console.error('Error creating channel:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get messages for a channel
  app.get('/api/channels/:channelId/messages', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: 'Invalid channel ID' });
      }
      
      // Check if user is a member of the channel
      const members = await storage.getChannelMembers(channelId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this channel' });
      }
      
      const messages = await storage.getMessages(channelId);
      res.json(messages);
    } catch (err) {
      console.error('Error fetching channel messages:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get direct messages between two users
  app.get('/api/messages/:recipientId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const recipientId = parseInt(req.params.recipientId);
      if (isNaN(recipientId)) {
        return res.status(400).json({ message: 'Invalid recipient ID' });
      }
      
      const messages = await storage.getMessages(undefined, req.user.id, recipientId);
      res.json(messages);
    } catch (err) {
      console.error('Error fetching direct messages:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Send a message
  app.post('/api/messages', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { content, recipientId, channelId, fileId } = req.body;
      
      if (!content && !fileId) {
        return res.status(400).json({ message: 'Message content or file is required' });
      }
      
      if (!recipientId && !channelId) {
        return res.status(400).json({ message: 'Recipient ID or channel ID is required' });
      }
      
      // Create message
      const message = await storage.createMessage({
        content: content || '',
        timestamp: new Date(),
        senderId: req.user.id,
        recipientId: recipientId ? parseInt(recipientId) : undefined,
        channelId: channelId ? parseInt(channelId) : undefined,
        fileId
      });
      
      res.status(201).json(message);
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get all users (for adding to channels, etc.)
  app.get('/api/users', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { asc }) => [asc(users.username)]
      });
      
      // Remove password from response
      const usersWithoutPassword = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPassword);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  return httpServer;
}
