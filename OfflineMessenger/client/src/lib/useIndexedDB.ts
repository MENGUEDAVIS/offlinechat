import { useState, useEffect } from 'react';

type IndexedDBStores = 'messages' | 'users' | 'channels' | 'files';

// Define the DB model types
export interface Message {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
  channelId?: number;
  recipientId?: number;
  fileId?: string;
  read: boolean;
  pending?: boolean;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  online: boolean;
  lastSeen: number;
  position?: string;
  department?: string;
}

export interface Channel {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  creatorId: number;
  memberIds: number[];
  createdAt: number;
}

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  data: Blob;
  uploaderId: number;
  uploadedAt: number;
}

// Database initialization
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SchoolChatDB', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('channelId', 'channelId', { unique: false });
        messagesStore.createIndex('senderId', 'senderId', { unique: false });
        messagesStore.createIndex('recipientId', 'recipientId', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        messagesStore.createIndex('pending', 'pending', { unique: false });
      }

      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('username', 'username', { unique: true });
      }

      if (!db.objectStoreNames.contains('channels')) {
        const channelsStore = db.createObjectStore('channels', { keyPath: 'id' });
        channelsStore.createIndex('creatorId', 'creatorId', { unique: false });
        channelsStore.createIndex('isPublic', 'isPublic', { unique: false });
      }

      if (!db.objectStoreNames.contains('files')) {
        const filesStore = db.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('uploaderId', 'uploaderId', { unique: false });
        filesStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Generic function to get all items from a store
export const getAllItems = <T>(db: IDBDatabase, storeName: IndexedDBStores): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to add item to a store
export const addItem = <T>(db: IDBDatabase, storeName: IndexedDBStores, item: T): Promise<T> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      resolve(item);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to update item in a store
export const updateItem = <T>(db: IDBDatabase, storeName: IndexedDBStores, item: T): Promise<T> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve(item);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to delete item from a store
export const deleteItem = <T>(db: IDBDatabase, storeName: IndexedDBStores, id: string | number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Custom hook for using IndexedDB
export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initDB()
      .then((database) => {
        setDb(database);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const getAll = async <T>(storeName: IndexedDBStores): Promise<T[]> => {
    if (!db) throw new Error('Database not initialized');
    return getAllItems<T>(db, storeName);
  };

  const add = async <T>(storeName: IndexedDBStores, item: T): Promise<T> => {
    if (!db) throw new Error('Database not initialized');
    return addItem<T>(db, storeName, item);
  };

  const update = async <T>(storeName: IndexedDBStores, item: T): Promise<T> => {
    if (!db) throw new Error('Database not initialized');
    return updateItem<T>(db, storeName, item);
  };

  const remove = async (storeName: IndexedDBStores, id: string | number): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    return deleteItem(db, storeName, id);
  };

  // Get messages for a specific channel or direct conversation
  const getMessages = async (channelId?: number, userId?: number, recipientId?: number): Promise<Message[]> => {
    if (!db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('messages', 'readonly');
      const store = transaction.objectStore('messages');
      
      let index;
      let range;
      
      if (channelId) {
        index = store.index('channelId');
        range = IDBKeyRange.only(channelId);
      } else if (userId && recipientId) {
        // For direct messages, we need to check both directions
        const messages: Message[] = [];
        
        // First get messages from user to recipient
        const trans1 = db.transaction('messages', 'readonly');
        const store1 = trans1.objectStore('messages');
        const index1 = store1.index('senderId');
        const range1 = IDBKeyRange.only(userId);
        
        const request1 = index1.openCursor(range1);
        
        request1.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const message = cursor.value as Message;
            if (message.recipientId === recipientId) {
              messages.push(message);
            }
            cursor.continue();
          } else {
            // Now get messages from recipient to user
            const trans2 = db.transaction('messages', 'readonly');
            const store2 = trans2.objectStore('messages');
            const index2 = store2.index('senderId');
            const range2 = IDBKeyRange.only(recipientId);
            
            const request2 = index2.openCursor(range2);
            
            request2.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result;
              if (cursor) {
                const message = cursor.value as Message;
                if (message.recipientId === userId) {
                  messages.push(message);
                }
                cursor.continue();
              } else {
                // Sort messages by timestamp
                messages.sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
              }
            };
            
            request2.onerror = () => {
              reject(request2.error);
            };
          }
        };
        
        request1.onerror = () => {
          reject(request1.error);
        };
        
        return;
      } else {
        // If no specific filter, get all messages
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        return;
      }
      
      const request = index.openCursor(range);
      const messages: Message[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          // Sort messages by timestamp
          messages.sort((a, b) => a.timestamp - b.timestamp);
          resolve(messages);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  };
  
  // Get pending messages that need to be synced
  const getPendingMessages = async (): Promise<Message[]> => {
    if (!db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('messages', 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('pending');
      const range = IDBKeyRange.only(true);
      
      const request = index.openCursor(range);
      const messages: Message[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          resolve(messages);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  };

  return {
    isLoading,
    error,
    getAll,
    add,
    update,
    remove,
    getMessages,
    getPendingMessages
  };
};
