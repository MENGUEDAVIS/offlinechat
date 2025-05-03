import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import Header from '@/components/chat/header';
import Sidebar from '@/components/chat/sidebar';
import ChatArea from '@/components/chat/chat-area';
import MobileNav from '@/components/chat/mobile-nav';

export default function HomePage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [mobileTab, setMobileTab] = useState<'messages' | 'channels' | 'calls' | 'profile'>('messages');
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>(undefined);
  const [activeChannelId, setActiveChannelId] = useState<number | undefined>(undefined);
  const [showAdminView, setShowAdminView] = useState(false);
  const [showTeacherView, setShowTeacherView] = useState(false);
  
  // Déterminer quelle vue afficher en fonction du rôle de l'utilisateur
  useEffect(() => {
    if (user) {
      setShowAdminView(user.role === 'admin');
      setShowTeacherView(user.role === 'teacher');
    }
  }, [user]);
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSelectChannel = (channelId: number) => {
    setActiveChannelId(channelId);
    setActiveConversationId(undefined);
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    setActiveChannelId(undefined);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header openSidebar={isMobile ? toggleSidebar : undefined} />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Only show sidebar if desktop or if sidebar is toggled on mobile */}
        {(showSidebar || !isMobile) && (
          <Sidebar 
            onSelectChannel={handleSelectChannel}
            onSelectConversation={handleSelectConversation}
            showAdminView={showAdminView}
            showTeacherView={showTeacherView}
          />
        )}
        
        {/* Mobile navigation (only visible on small screens) */}
        {isMobile && (
          <MobileNav
            activeTab={mobileTab}
            onTabChange={setMobileTab}
          />
        )}
        
        {/* Chat area */}
        <ChatArea
          conversationId={activeConversationId}
          channelId={activeChannelId}
        />
      </main>
    </div>
  );
}
