import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Check if users already exist
    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed");
      return;
    }
    
    // Create users
    const users = [
      {
        username: "admin",
        password: await hashPassword("password123"),
        displayName: "Administrateur",
        role: "admin",
        position: "Directeur de l'établissement",
        department: "Administration",
        avatar: "/avatars/admin.png",
        online: true
      },
      {
        username: "prof_math",
        password: await hashPassword("password123"),
        displayName: "Dr. Sophie Leclerc",
        role: "teacher",
        position: "Professeur de Mathématiques",
        department: "Sciences",
        avatar: "/avatars/teacher1.png",
        online: true
      },
      {
        username: "prof_francais",
        password: await hashPassword("password123"),
        displayName: "Marc Dupont",
        role: "teacher",
        position: "Professeur de Français",
        department: "Lettres",
        avatar: "/avatars/teacher2.png",
        online: false
      },
      {
        username: "etudiant1",
        password: await hashPassword("password123"),
        displayName: "Léa Martin",
        role: "student",
        position: "Élève de Terminale", 
        department: "Sciences",
        avatar: "/avatars/student1.png",
        online: true
      },
      {
        username: "etudiant2",
        password: await hashPassword("password123"),
        displayName: "Thomas Dubois",
        role: "student",
        position: "Élève de Première",
        department: "Lettres",
        avatar: "/avatars/student2.png",
        online: false
      }
    ];
    
    console.log("Creating users...");
    for (const user of users) {
      await db.insert(schema.users).values(user);
    }
    
    // Get created users
    const dbUsers = await db.query.users.findMany();
    
    // Create channels
    const channels = [
      {
        name: "Annonces Générales",
        description: "Informations officielles de l'établissement",
        isPublic: true,
        creatorId: dbUsers.find(u => u.username === "admin")?.id || dbUsers[0].id,
        createdAt: new Date()
      },
      {
        name: "Salle des Professeurs",
        description: "Espace réservé aux enseignants",
        isPublic: false,
        creatorId: dbUsers.find(u => u.username === "admin")?.id || dbUsers[0].id,
        createdAt: new Date()
      },
      {
        name: "Club de Math",
        description: "Discussions sur les mathématiques",
        isPublic: true,
        creatorId: dbUsers.find(u => u.username === "prof_math")?.id || dbUsers[0].id,
        createdAt: new Date()
      },
      {
        name: "Aide aux Devoirs",
        description: "Entraide pour les devoirs scolaires",
        isPublic: true,
        creatorId: dbUsers.find(u => u.username === "etudiant1")?.id || dbUsers[0].id,
        createdAt: new Date()
      }
    ];
    
    console.log("Creating channels...");
    for (const channel of channels) {
      await db.insert(schema.channels).values(channel);
    }
    
    // Get created channels
    const dbChannels = await db.query.channels.findMany();
    
    // Add members to channels
    console.log("Adding channel members...");
    
    // Annonces Générales - all users are members
    for (const user of dbUsers) {
      const annonceChannel = dbChannels.find(c => c.name === "Annonces Générales");
      if (annonceChannel) {
        await db.insert(schema.channelMembers).values({
          channelId: annonceChannel.id,
          userId: user.id,
          role: user.id === annonceChannel.creatorId ? "admin" : "member",
          joinedAt: new Date()
        });
      }
    }
    
    // Salle des Professeurs - only teachers and admin
    const teacherChannel = dbChannels.find(c => c.name === "Salle des Professeurs");
    if (teacherChannel) {
      const teacherUsernames = ["admin", "prof_math", "prof_francais"];
      for (const username of teacherUsernames) {
        const user = dbUsers.find(u => u.username === username);
        if (user) {
          await db.insert(schema.channelMembers).values({
            channelId: teacherChannel.id,
            userId: user.id,
            role: user.id === teacherChannel.creatorId ? "admin" : "member",
            joinedAt: new Date()
          });
        }
      }
    }
    
    // Club de Math - prof de math et quelques étudiants
    const mathChannel = dbChannels.find(c => c.name === "Club de Math");
    if (mathChannel) {
      const memberUsernames = ["admin", "prof_math", "etudiant1"];
      for (const username of memberUsernames) {
        const user = dbUsers.find(u => u.username === username);
        if (user) {
          await db.insert(schema.channelMembers).values({
            channelId: mathChannel.id,
            userId: user.id,
            role: user.id === mathChannel.creatorId ? "admin" : "member",
            joinedAt: new Date()
          });
        }
      }
    }
    
    // Aide aux Devoirs - tous les utilisateurs
    const aideChannel = dbChannels.find(c => c.name === "Aide aux Devoirs");
    if (aideChannel) {
      for (const user of dbUsers) {
        await db.insert(schema.channelMembers).values({
          channelId: aideChannel.id,
          userId: user.id,
          role: user.id === aideChannel.creatorId ? "admin" : "member",
          joinedAt: new Date()
        });
      }
    }
    
    // Create some sample messages
    console.log("Creating sample messages...");
    
    const messages = [
      {
        id: "msg1",
        content: "Bienvenue à tous dans notre nouvelle application de chat de l'école!",
        timestamp: new Date(Date.now() - 3600000 * 3), // 3 hours ago
        senderId: dbUsers.find(u => u.username === "admin")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Annonces Générales")?.id
      },
      {
        id: "msg2",
        content: "Rappel: La réunion de rentrée aura lieu le 3 septembre à 10h dans l'amphithéâtre principal.",
        timestamp: new Date(Date.now() - 3580000 * 3), // 2 hours 59 minutes ago
        senderId: dbUsers.find(u => u.username === "admin")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Annonces Générales")?.id
      },
      {
        id: "msg3",
        content: "Bonjour à tous les collègues, j'espère que vos vacances se sont bien passées.",
        timestamp: new Date(Date.now() - 3500000 * 3), // 2 hours 55 minutes ago
        senderId: dbUsers.find(u => u.username === "prof_math")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Salle des Professeurs")?.id
      },
      {
        id: "msg4",
        content: "J'ai mis à jour le programme de mathématiques pour cette année. Vous pouvez le consulter sur l'ENT.",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        senderId: dbUsers.find(u => u.username === "prof_math")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Club de Math")?.id
      },
      {
        id: "msg5",
        content: "Bonjour Dr. Leclerc, pouvez-vous m'envoyer les exercices supplémentaires?",
        timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
        senderId: dbUsers.find(u => u.username === "etudiant1")?.id || dbUsers[0].id,
        recipientId: dbUsers.find(u => u.username === "prof_math")?.id
      },
      {
        id: "msg6",
        content: "J'ai des difficultés avec les équations du second degré, quelqu'un peut m'aider?",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        senderId: dbUsers.find(u => u.username === "etudiant2")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Aide aux Devoirs")?.id
      },
      {
        id: "msg7",
        content: "Bien sûr, je peux t'aider après les cours demain. Apporte tes exercices.",
        timestamp: new Date(Date.now() - 43200000), // 12 hours ago
        senderId: dbUsers.find(u => u.username === "prof_francais")?.id || dbUsers[0].id,
        channelId: dbChannels.find(c => c.name === "Aide aux Devoirs")?.id
      }
    ];
    
    for (const message of messages) {
      if (message.senderId) {
        await db.insert(schema.messages).values(message);
      }
    }
    
    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

seed();
