import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import CreateGroupModal from '@/components/modals/create-group-modal';
import ContactDirectory from '@/components/contact/contact-directory';

// Define types for conversations and channels
type Conversation = {
  id: number;
  user: {
    id: number;
    username: string;
    displayName: string;
    initials: string;
    isOnline: boolean;
    role?: string;
    position?: string;
  };
  lastMessage: {
    text: string;
    time: string;
  };
};

type Channel = {
  id: number;
  name: string;
  description?: string;
  isPublic?: boolean;
  lastMessage?: {
    user: string;
    text: string;
    time: string;
  };
};

type ConversationType = 'all' | 'private' | 'groups' | 'classes';

type SidebarProps = {
  onSelectChannel: (channelId: number) => void;
  onSelectConversation: (conversationId: number) => void;
  showAdminView?: boolean;
  showTeacherView?: boolean;
};

export default function Sidebar({ 
  onSelectChannel, 
  onSelectConversation,
  showAdminView = false,
  showTeacherView = false
}: SidebarProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [conversationType, setConversationType] = useState<ConversationType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showContactDirectory, setShowContactDirectory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'channels'>('messages');
  
  // Simuler la récupération des canaux depuis le backend
  useEffect(() => {
    // Dans une vraie application, ces données viendraient d'une API
    const mockChannels: Channel[] = [
      {
        id: 1,
        name: "Annonces Générales",
        description: "Informations officielles de l'établissement",
        isPublic: true,
        lastMessage: {
          user: "Admin",
          text: "Bienvenue à tous dans notre application!",
          time: "10:30"
        }
      },
      {
        id: 2,
        name: "Salle des Professeurs",
        description: "Espace réservé aux enseignants",
        isPublic: false,
        lastMessage: {
          user: "Dr. Sophie",
          text: "Bonjour à tous les collègues",
          time: "11:15"
        }
      },
      {
        id: 3,
        name: "Club de Math",
        description: "Discussions sur les mathématiques",
        isPublic: true,
        lastMessage: {
          user: "Dr. Sophie",
          text: "J'ai mis à jour le programme",
          time: "09:45"
        }
      },
      {
        id: 4,
        name: "Aide aux Devoirs",
        description: "Entraide pour les devoirs scolaires",
        isPublic: true,
        lastMessage: {
          user: "Léa",
          text: "J'ai une question sur l'exercice 3",
          time: "Hier"
        }
      },
      // Classes spécifiques
      {
        id: 5,
        name: "Classe 4A",
        description: "Canal de la classe 4A",
        isPublic: false,
        lastMessage: {
          user: "M. Dupont",
          text: "Bonjour, pourriez-vous partager vos notes?",
          time: "jeu."
        }
      },
      {
        id: 6,
        name: "Mathématiques",
        description: "Cours de mathématiques",
        isPublic: false,
        lastMessage: {
          user: "Dr. Sophie",
          text: "Bonjour, pourriez-vous partager vos notes?",
          time: "06:39"
        }
      },
      {
        id: 7,
        name: "Projet Sciences",
        description: "Groupe de projet scientifique",
        isPublic: false,
        lastMessage: {
          user: "T. Dubois",
          text: "Bonjour, pourriez-vous partager vos notes?",
          time: "ven."
        }
      }
    ];
    
    const mockConversations: Conversation[] = [
      {
        id: 101,
        user: {
          id: 2,
          username: "prof_math",
          displayName: "Dr. Sophie Leclerc",
          initials: "SL",
          isOnline: true,
          role: "teacher",
          position: "Professeur de Mathématiques"
        },
        lastMessage: {
          text: "Bonjour, comment puis-je vous aider?",
          time: "11:45"
        }
      },
      {
        id: 102,
        user: {
          id: 3,
          username: "prof_francais",
          displayName: "Marc Dupont",
          initials: "MD",
          isOnline: false,
          role: "teacher",
          position: "Professeur de Français"
        },
        lastMessage: {
          text: "N'oubliez pas le devoir pour lundi",
          time: "Hier"
        }
      },
      {
        id: 103,
        user: {
          id: 1,
          username: "admin",
          displayName: "Administrateur",
          initials: "AD",
          isOnline: true,
          role: "admin",
          position: "Directeur de l'établissement"
        },
        lastMessage: {
          text: "Je voulais vous informer du changement d'horaire",
          time: "Lun"
        }
      },
      {
        id: 104,
        user: {
          id: 4,
          username: "etudiant1",
          displayName: "Jean Dupont",
          initials: "JD",
          isOnline: true,
          role: "student",
          position: "Étudiant"
        },
        lastMessage: {
          text: "Bonjour, pourriez-vous partager vos notes?",
          time: "10:39"
        }
      },
      {
        id: 105,
        user: {
          id: 5,
          username: "etudiant2",
          displayName: "Marie Curie",
          initials: "MC",
          isOnline: true,
          role: "student",
          position: "Étudiante"
        },
        lastMessage: {
          text: "Bonjour, pourriez-vous partager vos notes?",
          time: "16:39"
        }
      }
    ];
    
    // Filtrer les canaux selon le rôle 
    let filteredChannels = [...mockChannels];
    
    // Si l'utilisateur n'est pas admin ou prof, ne pas montrer la salle des profs
    if (!showAdminView && !showTeacherView) {
      filteredChannels = filteredChannels.filter(c => c.name !== "Salle des Professeurs");
    }
    
    setChannels(filteredChannels);
    setConversations(mockConversations);
  }, [showAdminView, showTeacherView]);
  
  // Gérer la sélection d'un canal ou d'une conversation
  const handleItemClick = (id: number) => {
    setActiveItem(id);
    
    // Identifier si c'est un canal ou une conversation privée
    const isChannel = channels.some(channel => channel.id === id);
    const isConversation = conversations.some(convo => convo.id === id);
    
    if (isChannel) {
      onSelectChannel(id);
    } else if (isConversation) {
      onSelectConversation(id);
    }
  };
  
  // Créer une nouvelle conversation avec un contact
  const handleNewConversation = (contactId: number) => {
    // En production, créerait une nouvelle conversation dans la base de données
    // Pour l'instant, simulons juste la sélection de ce contact
    onSelectConversation(contactId);
  };

  // Generate user initials
  const getUserInitials = () => {
    if (!user?.displayName) return user?.username?.substring(0, 2).toUpperCase() || 'U';
    return user.displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <nav className="w-80 bg-white border-r border-gray-200 flex flex-col h-full hidden md:flex">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 bg-primary text-white">
          <div className="text-lg font-bold flex items-center">
            <span className="mdi mdi-school mr-2"></span>
            École Chat
          </div>
        </div>
        
        {/* Search Box */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <span className="mdi mdi-magnify"></span>
            </span>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 bg-neutral rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Conversation Type Tabs */}
        <div className="p-2 border-b border-gray-200 flex overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setConversationType('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${conversationType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Tous
          </button>
          <button 
            onClick={() => setConversationType('private')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'private' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Privés
          </button>
          <button 
            onClick={() => setConversationType('groups')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'groups' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Groupes
          </button>
          <button 
            onClick={() => setConversationType('classes')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'classes' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Salons
          </button>
        </div>
        
        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-200">
          <button 
            onClick={() => setShowContactDirectory(true)}
            className="flex flex-col items-center justify-center p-2 bg-neutral hover:bg-gray-200 rounded-lg transition">
            <span className="mdi mdi-account-search text-xl text-primary"></span>
            <span className="text-xs text-gray-700 mt-1">Annuaire</span>
          </button>
          <button 
            onClick={() => setShowCreateGroupModal(true)}
            className="flex flex-col items-center justify-center p-2 bg-neutral hover:bg-gray-200 rounded-lg transition">
            <span className="mdi mdi-account-group text-xl text-primary"></span>
            <span className="text-xs text-gray-700 mt-1">Créer un groupe</span>
          </button>
        </div>
        
        {/* Conversations or Channels List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Empty state when no items are available */}
          {((conversations.length === 0 && channels.length === 0)) && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <span className="mdi mdi-chat-outline text-4xl text-primary mb-2"></span>
              <h3 className="font-medium text-lg">Aucune conversation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Commencez à discuter avec vos collègues ou créez un nouveau groupe
              </p>
            </div>
          )}
          
          {/* Conversations based on type */}
          {(() => {
            // Define types for our combined items
            type ConversationItem = {
              type: 'conversation';
              data: Conversation;
              id: number;
            };
            
            type ChannelItem = {
              type: 'channel';
              data: Channel;
              id: number;
            };
            
            type ChatItem = ConversationItem | ChannelItem;
            
            // Combine and filter conversations and channels based on the selected type
            let items: ChatItem[] = [];
            
            if (conversationType === 'all') {
              // Show all conversations and channels
              items = [
                ...conversations.map(convo => ({ type: 'conversation' as const, data: convo, id: convo.id })),
                ...channels.map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }))
              ];
            } else if (conversationType === 'private') {
              // Show only private conversations
              items = conversations.map(convo => ({ type: 'conversation' as const, data: convo, id: convo.id }));
            } else if (conversationType === 'groups') {
              // Show group channels (not classes)
              items = channels
                .filter(channel => !['Classe 4A', 'Classe 3B'].includes(channel.name))
                .map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }));
            } else if (conversationType === 'classes') {
              // Show only class channels
              items = channels
                .filter(channel => ['Classe 4A', 'Classe 3B', 'Mathématiques', 'Projet Sciences'].includes(channel.name))
                .map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }));
            }
            
            // Filter by search term if needed
            if (searchTerm) {
              items = items.filter(item => {
                if (item.type === 'conversation') {
                  const convo = item.data;
                  return convo.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         convo.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase());
                } else {
                  const channel = item.data;
                  return channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (channel.lastMessage && channel.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase()));
                }
              });
            }
            
            return (
              <div className="divide-y divide-gray-100">
                {items.map(item => {
                  if (item.type === 'conversation') {
                    const convo = item.data;
                    return (
                      <div 
                        key={convo.id}
                        className={`p-3 hover:bg-neutral cursor-pointer ${activeItem === convo.id ? 'bg-neutral' : ''}`}
                        onClick={() => handleItemClick(convo.id)}
                      >
                        <div className="flex">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mr-3">
                              <span className="text-primary font-medium">{convo.user.initials}</span>
                            </div>
                            {convo.user.isOnline && (
                              <span className="absolute bottom-0 right-2 w-3 h-3 bg-accent rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">{convo.user.displayName}</span>
                              <span className="text-xs text-gray-500">{convo.lastMessage.time}</span>
                            </div>
                            <p className="text-gray-600 text-sm truncate">{convo.lastMessage.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const channel = item.data;
                    return (
                      <div 
                        key={channel.id}
                        className={`p-3 hover:bg-neutral cursor-pointer ${activeItem === channel.id ? 'bg-neutral' : ''}`}
                        onClick={() => handleItemClick(channel.id)}
                      >
                        <div className="flex">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-3 text-white">
                            <span className="font-medium">{channel.name.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">{channel.name}</span>
                              <span className="text-xs text-gray-500">{channel.lastMessage?.time || ''}</span>
                            </div>
                            <p className="text-gray-600 text-sm truncate">
                              {channel.lastMessage ? `${channel.lastMessage.user}: ${channel.lastMessage.text}` : 'Pas de messages récents'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            );
          })()} 
        </div>
        
        {/* User Status Bar */}
        <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 text-white">
                <span>{getUserInitials()}</span>
              </div>
              <span className="absolute bottom-0 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user?.displayName || user?.username}</div>
              <div className="flex items-center text-xs text-gray-500">
                <span className="w-2 h-2 bg-accent rounded-full mr-1"></span>
                <span>En ligne</span>
              </div>
            </div>
          </div>
          <button className="text-gray-500 hover:text-primary">
            <span className="mdi mdi-cog text-xl"></span>
          </button>
        </div>
      </nav>
      
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-white flex flex-col h-full">
        {/* Mobile Header */}
        <div className="p-3 bg-primary text-white flex justify-between items-center">
          <div className="text-lg font-bold flex items-center">
            <span className="mdi mdi-school mr-2"></span>
            École Chat
          </div>
          <div>
            <button className="p-2">
              <span className="mdi mdi-magnify text-xl"></span>
            </button>
          </div>
        </div>
        
        {/* Mobile Conversation Types */}
        <div className="p-2 border-b border-gray-200 flex overflow-x-auto no-scrollbar bg-white">
          <button 
            onClick={() => setConversationType('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${conversationType === 'all' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
          >
            Tous
          </button>
          <button 
            onClick={() => setConversationType('private')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'private' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
          >
            Privés
          </button>
          <button 
            onClick={() => setConversationType('groups')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'groups' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
          >
            Groupes
          </button>
          <button 
            onClick={() => setConversationType('classes')}
            className={`px-3 py-1 rounded-full text-sm ml-1 whitespace-nowrap ${conversationType === 'classes' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
          >
            Salons
          </button>
        </div>
        
        {/* Mobile Conversation List - Simplified version of the desktop list */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {(() => {
            // Define types for our combined items (same as desktop)
            type ConversationItem = {
              type: 'conversation';
              data: Conversation;
              id: number;
            };
            
            type ChannelItem = {
              type: 'channel';
              data: Channel;
              id: number;
            };
            
            type ChatItem = ConversationItem | ChannelItem;
            
            // Reuse same logic as desktop but with simpler styling
            let items: ChatItem[] = [];
            
            if (conversationType === 'all') {
              items = [
                ...conversations.map(convo => ({ type: 'conversation' as const, data: convo, id: convo.id })),
                ...channels.map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }))
              ];
            } else if (conversationType === 'private') {
              items = conversations.map(convo => ({ type: 'conversation' as const, data: convo, id: convo.id }));
            } else if (conversationType === 'groups') {
              items = channels
                .filter(channel => !['Classe 4A', 'Classe 3B'].includes(channel.name))
                .map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }));
            } else if (conversationType === 'classes') {
              items = channels
                .filter(channel => ['Classe 4A', 'Classe 3B', 'Mathématiques', 'Projet Sciences'].includes(channel.name))
                .map(channel => ({ type: 'channel' as const, data: channel, id: channel.id }));
            }
            
            // Filter by search term
            if (searchTerm) {
              items = items.filter(item => {
                if (item.type === 'conversation') {
                  const convo = item.data;
                  return convo.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         convo.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase());
                } else {
                  const channel = item.data;
                  return channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (channel.lastMessage && channel.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase()));
                }
              });
            }
            
            return (
              <div className="divide-y divide-gray-100">
                {items.map(item => {
                  if (item.type === 'conversation') {
                    const convo = item.data;
                    return (
                      <div 
                        key={convo.id}
                        className={`p-3 hover:bg-neutral cursor-pointer ${activeItem === convo.id ? 'bg-neutral' : ''}`}
                        onClick={() => handleItemClick(convo.id)}
                      >
                        <div className="flex">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                              <span className="text-primary font-medium">{convo.user.initials}</span>
                            </div>
                            {convo.user.isOnline && (
                              <span className="absolute bottom-0 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">{convo.user.displayName}</span>
                              <span className="text-xs text-gray-500">{convo.lastMessage.time}</span>
                            </div>
                            <p className="text-gray-600 text-sm truncate">{convo.lastMessage.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const channel = item.data;
                    return (
                      <div 
                        key={channel.id}
                        className={`p-3 hover:bg-neutral cursor-pointer ${activeItem === channel.id ? 'bg-neutral' : ''}`}
                        onClick={() => handleItemClick(channel.id)}
                      >
                        <div className="flex">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 text-white">
                            <span className="font-medium">{channel.name.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">{channel.name}</span>
                              <span className="text-xs text-gray-500">{channel.lastMessage?.time || ''}</span>
                            </div>
                            <p className="text-gray-600 text-sm truncate">
                              {channel.lastMessage ? channel.lastMessage.text : 'Pas de messages récents'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            );
          })()}
        </div>
        
        {/* Mobile floating action button */}
        <div className="fixed bottom-6 right-6 z-10">
          <button 
            onClick={() => setShowContactDirectory(true)}
            className="w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center text-white">
            <span className="mdi mdi-plus text-2xl"></span>
          </button>
        </div>
      </div>
      
      {/* Modals */}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
      
      {showContactDirectory && (
        <ContactDirectory 
          onSelectContact={handleNewConversation} 
          onClose={() => setShowContactDirectory(false)} 
        />
      )}
    </>
  );
}
