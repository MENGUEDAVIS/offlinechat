import { db } from "@db";
import { 
  users, 
  channels, 
  channelMembers, 
  messages, 
  files 
} from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";
import { 
  User, 
  InsertUser, 
  Channel, 
  ChannelMember, 
  InsertChannel,
  InsertChannelMember,
  Message,
  InsertMessage,
  File,
  InsertFile
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  
  // Channel methods
  getChannels(): Promise<Channel[]>;
  getChannelById(id: number): Promise<Channel | undefined>;
  getChannelsByUserId(userId: number): Promise<Channel[]>;
  createChannel(channelData: InsertChannel): Promise<Channel>;
  
  // Channel member methods
  getChannelMembers(channelId: number): Promise<ChannelMember[]>;
  addMemberToChannel(memberData: InsertChannelMember): Promise<ChannelMember>;
  removeMemberFromChannel(channelId: number, userId: number): Promise<void>;
  
  // Message methods
  getMessages(channelId?: number, senderId?: number, recipientId?: number): Promise<Message[]>;
  createMessage(messageData: InsertMessage): Promise<Message>;
  
  // File methods
  getFileById(id: string): Promise<File | undefined>;
  createFile(fileData: InsertFile): Promise<File>;
  
  // Session store
  sessionStore: session.SessionStore;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  // Channel methods
  async getChannels(): Promise<Channel[]> {
    return await db.query.channels.findMany({
      orderBy: desc(channels.createdAt)
    });
  }
  
  async getChannelById(id: number): Promise<Channel | undefined> {
    return await db.query.channels.findFirst({
      where: eq(channels.id, id)
    });
  }
  
  async getChannelsByUserId(userId: number): Promise<Channel[]> {
    // Find all channels where the user is a member
    const memberChannels = await db.query.channelMembers.findMany({
      where: eq(channelMembers.userId, userId),
      with: {
        channel: true
      }
    });
    
    return memberChannels.map(mc => mc.channel);
  }
  
  async createChannel(channelData: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(channelData).returning();
    return channel;
  }
  
  // Channel member methods
  async getChannelMembers(channelId: number): Promise<ChannelMember[]> {
    return await db.query.channelMembers.findMany({
      where: eq(channelMembers.channelId, channelId),
      with: {
        user: true
      }
    });
  }
  
  async addMemberToChannel(memberData: InsertChannelMember): Promise<ChannelMember> {
    const [member] = await db.insert(channelMembers).values(memberData).returning();
    return member;
  }
  
  async removeMemberFromChannel(channelId: number, userId: number): Promise<void> {
    await db.delete(channelMembers)
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          eq(channelMembers.userId, userId)
        )
      );
  }
  
  // Message methods
  async getMessages(channelId?: number, senderId?: number, recipientId?: number): Promise<Message[]> {
    let query = db.select().from(messages);
    
    if (channelId) {
      query = query.where(eq(messages.channelId, channelId));
    } else if (senderId && recipientId) {
      // For direct messages, we need to check both directions
      query = query.where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.recipientId, recipientId)
        )
      );
      
      // Union with messages in the opposite direction
      const reverseQuery = db.select().from(messages).where(
        and(
          eq(messages.senderId, recipientId),
          eq(messages.recipientId, senderId)
        )
      );
      
      // Combine and sort
      const allMessages = await query.union(reverseQuery);
      return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    
    return query.orderBy(messages.timestamp);
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }
  
  // File methods
  async getFileById(id: string): Promise<File | undefined> {
    return await db.query.files.findFirst({
      where: eq(files.id, id)
    });
  }
  
  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
  }
}

// Export an instance of the storage implementation
export const storage = new DatabaseStorage();
