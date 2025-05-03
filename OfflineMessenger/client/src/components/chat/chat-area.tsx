import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/lib/useWebSocket';
import { useIndexedDB, Message } from '@/lib/useIndexedDB';
import VoiceCallModal from '@/components/modals/voice-call-modal';
import FileUploadModal from '@/components/modals/file-upload-modal';

type ChatAreaProps = {
  conversationId?: number;
  channelId?: number;
};

type Conversation = {
  id: number;
  name: string;
  type: 'direct' | 'channel';
  participants: number;
  online: number;
  isOnline?: boolean;
};

export default function ChatArea({ conversationId, channelId }: ChatAreaProps) {
  const { user } = useAuth();
  const { getMessages, add: addMessage } = useIndexedDB();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Create a stable reference to user?.id, channelId, and conversationId
  const userId = user?.id;
  
  // Memoize the message handler to prevent recreation on each render
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'message' && 
       ((data.channelId && data.channelId === channelId) || 
        (data.senderId && data.recipientId === userId))) {
      // Add new message to state
      const newMessage: Message = {
        id: data.id,
        senderId: data.senderId,
        content: data.content,
        timestamp: data.timestamp,
        channelId: data.channelId,
        recipientId: data.recipientId,
        fileId: data.fileId,
        read: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Store in IndexedDB
      addMessage('messages', newMessage).catch(err => 
        console.error('Error storing message in IndexedDB:', err)
      );
    } else if (data.type === 'typing') {
      if ((channelId && data.channelId === channelId) || 
          (conversationId && data.senderId === conversationId)) {
        setIsTyping(true);
        // Clear typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    }
  }, [userId, channelId, conversationId, addMessage]);

  // Memoize WebSocket hook to prevent recreating the WebSocket connection on every render
  const webSocketHook = useMemo(() => useWebSocket({
    onMessage: handleMessage
  }), [handleMessage]);
  
  const { sendMessage, isConnected } = webSocketHook;
  
  // Load messages for the current conversation
  useEffect(() => {
    const loadMessages = async () => {
      try {
        let loadedMessages: Message[] = [];
        
        if (channelId) {
          loadedMessages = await getMessages(channelId);
          setCurrentConversation({
            id: channelId,
            name: channelId === 0 ? 'Sélectionnez un salon de discussion' : 'Récupération du salon...', // Will be replaced with API data
            type: 'channel',
            participants: 12,
            online: 3
          });
        } else if (conversationId && user?.id) {
          loadedMessages = await getMessages(undefined, user.id, conversationId);
          
          // Trouver l'utilisateur approprié pour l'affichage
          let displayName = 'Utilisateur';
          let isOnline = false;
          
          if (conversationId === 2) {
            displayName = 'Dr. Sophie Leclerc';
            isOnline = true;
          } else if (conversationId === 3) {
            displayName = 'Marc Dupont';
            isOnline = false;
          }
          
          setCurrentConversation({
            id: conversationId,
            name: displayName,
            type: 'direct',
            participants: 2,
            online: 1,
            isOnline: isOnline
          });
        } else {
          // Si aucune conversation n'est sélectionnée, afficher un état vide
          setCurrentConversation({
            id: 0,
            name: 'Sélectionnez un canal ou une conversation',
            type: 'channel',
            participants: 0,
            online: 0
          });
        }
        
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    
    loadMessages();
  }, [channelId, conversationId, user?.id, getMessages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !user) return;
    
    // Create a new message
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: messageText,
      timestamp: Date.now(),
      channelId: channelId,
      recipientId: conversationId,
      read: false,
      pending: !isConnected // Mark as pending if offline
    };
    
    // Add to local state
    setMessages(prev => [...prev, newMessage]);
    
    // Store in IndexedDB
    addMessage('messages', newMessage).catch(err => 
      console.error('Error storing message in IndexedDB:', err)
    );
    
    // Send via WebSocket if connected
    if (isConnected) {
      sendMessage({
        type: 'message',
        ...newMessage
      });
    }
    
    // Clear input
    setMessageText('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle typing notification
  const handleTyping = () => {
    if (isConnected) {
      sendMessage({
        type: 'typing',
        senderId: user?.id,
        channelId: channelId,
        recipientId: conversationId,
        timestamp: Date.now()
      });
    }
  };
  
  // Format a timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get initials from a username
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      {currentConversation && (
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 text-white">
                <span>{currentConversation.type === 'channel' ? currentConversation.name.substring(0, 2) : 'AE'}</span>
              </div>
              {currentConversation.isOnline && (
                <span className="absolute bottom-0 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white"></span>
              )}
            </div>
            <div>
              <div className="font-medium">{currentConversation.name}</div>
              <div className="text-xs text-gray-500">
                {currentConversation.type === 'channel' 
                  ? `${currentConversation.participants} membres, ${currentConversation.online} en ligne`
                  : currentConversation.isOnline ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentConversation.type === 'direct' && (
              <button 
                className="p-2 rounded-full hover:bg-neutral text-gray-500 hover:text-primary"
                onClick={() => setShowVoiceCallModal(true)}
              >
                <span className="mdi mdi-phone text-xl"></span>
              </button>
            )}
            <button className="p-2 rounded-full hover:bg-neutral text-gray-500 hover:text-primary">
              <span className="mdi mdi-information-outline text-xl"></span>
            </button>
          </div>
        </div>
      )}
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral no-scrollbar">
        {messages.length === 0 && channelId === undefined && conversationId === undefined ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4 text-primary">
              <span className="mdi mdi-chat-outline text-4xl"></span>
            </div>
            <h3 className="text-xl font-medium mb-2">Bienvenue dans votre application de chat</h3>
            <p className="text-gray-500 max-w-md">
              Sélectionnez un salon de discussion ou un utilisateur dans la barre latérale pour commencer à échanger des messages.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length > 0 && (
              <div className="flex justify-center">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm inline-block">
                  <p className="text-sm text-gray-500">Aujourd'hui</p>
                </div>
              </div>
            )}
            
            {/* Render messages */}
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex items-end ${message.senderId === user?.id ? 'justify-end' : ''}`}
              >
                {message.senderId !== user?.id && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">AE</span>
                    </div>
                  </div>
                )}
                
                <div className={`max-w-[75%] ${message.senderId === user?.id ? '' : ''}`}>
                  {message.senderId !== user?.id && (
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-sm mr-2">Albert Einstein</span>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    </div>
                  )}
                  
                  {message.senderId === user?.id && (
                    <div className="text-right mb-1">
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      {message.pending && (
                        <span className="ml-1 text-xs text-gray-400">
                          <span className="mdi mdi-clock-outline"></span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`${
                    message.senderId === user?.id 
                      ? 'bg-secondary rounded-lg rounded-tr-none' 
                      : 'bg-neutral rounded-lg rounded-tl-none'
                  } p-3`}>
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end">
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-primary text-xs font-medium">AE</span>
                  </div>
                </div>
                <div className="max-w-[75%]">
                  <div className="flex items-center">
                    <span className="font-medium text-sm mr-2">Albert Einstein</span>
                    <span className="text-xs text-gray-500">écrit...</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-lg rounded-tl-none inline-flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dummy div for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        {(channelId !== undefined || conversationId !== undefined) ? (
          <div className="flex items-end gap-2">
            <button className="p-2 rounded-full hover:bg-neutral text-gray-500 hover:text-primary">
              <span className="mdi mdi-emoticon-outline text-xl"></span>
            </button>
            <button 
              className="p-2 rounded-full hover:bg-neutral text-gray-500 hover:text-primary"
              onClick={() => setShowFileUploadModal(true)}
            >
              <span className="mdi mdi-paperclip text-xl"></span>
            </button>
            <div className="flex-1 relative">
              <textarea 
                ref={textareaRef}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Écrivez votre message..."
                rows={1}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
              ></textarea>
            </div>
            <button 
              className="p-2 rounded-full bg-primary text-white hover:bg-primary/80"
              onClick={handleSendMessage}
            >
              <span className="mdi mdi-send text-xl"></span>
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-2">
            Sélectionnez une conversation pour envoyer un message
          </div>
        )}
      </div>
      
      {/* Voice Call Modal */}
      {showVoiceCallModal && (
        <VoiceCallModal onClose={() => setShowVoiceCallModal(false)} />
      )}
      
      {/* File Upload Modal */}
      {showFileUploadModal && (
        <FileUploadModal onClose={() => setShowFileUploadModal(false)} />
      )}
    </div>
  );
}