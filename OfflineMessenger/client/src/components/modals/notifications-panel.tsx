import { useState } from 'react';

type NotificationsPanelProps = {
  onClose: () => void;
};

type Notification = {
  id: string;
  type: 'message' | 'invitation' | 'file';
  title: string;
  content: string;
  time: string;
  icon: string;
  read: boolean;
};

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'Nouveau message',
      content: 'Thomas a envoyé un message dans le salon Physique',
      time: 'il y a 5 minutes',
      icon: 'mdi-bell',
      read: false
    },
    {
      id: '2',
      type: 'invitation',
      title: 'Invitation au salon',
      content: 'Marie vous a invité au salon "Projet Sciences"',
      time: 'il y a 1 heure',
      icon: 'mdi-account-plus',
      read: false
    },
    {
      id: '3',
      type: 'file',
      title: 'Nouveau fichier partagé',
      content: 'Albert a partagé "cours_physique.pdf" dans Physique Avancée',
      time: 'hier',
      icon: 'mdi-file-document',
      read: false
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };
  
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking on the background div
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40" onClick={handleClickOutside}>
      <div 
        className="fixed right-4 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Notifications</h3>
            <button 
              className="text-sm text-primary hover:text-primary/80"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <span className="mdi mdi-bell-off text-4xl block mb-2"></span>
              <p>Aucune notification</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b border-gray-100 hover:bg-neutral ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                    <span className={`mdi ${notification.icon} text-xl text-primary`}></span>
                  </div>
                  <div>
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm">{notification.content}</div>
                    <div className="text-xs text-gray-500">{notification.time}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-200">
            <button className="w-full py-2 text-center text-primary hover:bg-neutral rounded">
              Voir toutes les notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
