import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import SearchOverlay from '@/components/modals/search-overlay';
import NotificationsPanel from '@/components/modals/notifications-panel';

type HeaderProps = {
  openSidebar?: () => void;
};

export default function Header({ openSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.displayName) return user?.username?.substring(0, 2).toUpperCase() || 'U';
    return user.displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setShowProfileMenu(false);
  };

  return (
    <>
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <div className="flex items-center">
              {isMobile && openSidebar && (
                <button onClick={openSidebar} className="text-white mr-2">
                  <span className="mdi mdi-menu text-2xl"></span>
                </button>
              )}
              <span className="text-white font-bold text-lg">SchoolChat</span>
              {/* Offline indicator - controlled by navigator.onLine status */}
              {!navigator.onLine && (
                <div className="ml-3 px-2 py-1 bg-neutral rounded-full text-xs flex items-center">
                  <span className="mdi mdi-cloud-off-outline text-primary mr-1"></span>
                  <span>Hors ligne</span>
                </div>
              )}
            </div>
            
            {/* Navigation Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button 
                onClick={() => setShowSearch(true)}
                className="text-white hover:text-secondary transition-colors"
              >
                <span className="mdi mdi-magnify text-2xl"></span>
              </button>
              
              {/* Notifications Icon with Badge */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-white hover:text-secondary transition-colors"
                >
                  <span className="mdi mdi-bell text-2xl"></span>
                </button>
                {/* Dynamic notification badge */}
                <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  3
                </span>
              </div>
              
              {/* User Profile Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center text-white hover:text-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center text-white">
                    <span>{getInitials()}</span>
                  </div>
                </button>
                
                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium">{user?.displayName || user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-neutral">
                      <span className="mdi mdi-account mr-2"></span>
                      Mon profil
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm hover:bg-neutral">
                      <span className="mdi mdi-cog mr-2"></span>
                      Paramètres
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-neutral"
                    >
                      <span className="mdi mdi-logout mr-2"></span>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Search Overlay */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      
      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationsPanel 
          onClose={() => setShowNotifications(false)} 
        />
      )}
    </>
  );
}
