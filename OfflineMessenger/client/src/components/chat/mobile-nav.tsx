import { useState } from 'react';

type MobileNavProps = {
  onTabChange: (tab: 'messages' | 'channels' | 'calls' | 'profile') => void;
  activeTab: 'messages' | 'channels' | 'calls' | 'profile';
};

export default function MobileNav({ onTabChange, activeTab }: MobileNavProps) {
  return (
    <div className="md:hidden bg-white border-b border-gray-200 w-full">
      <div className="flex justify-around text-center">
        <button 
          className={`flex-1 py-3 ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => onTabChange('messages')}
        >
          <span className="mdi mdi-message-text block text-xl"></span>
          <span className="text-xs">Messages</span>
        </button>
        <button 
          className={`flex-1 py-3 ${activeTab === 'channels' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => onTabChange('channels')}
        >
          <span className="mdi mdi-forum block text-xl"></span>
          <span className="text-xs">Salons</span>
        </button>
        <button 
          className={`flex-1 py-3 ${activeTab === 'calls' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => onTabChange('calls')}
        >
          <span className="mdi mdi-phone block text-xl"></span>
          <span className="text-xs">Appels</span>
        </button>
        <button 
          className={`flex-1 py-3 ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => onTabChange('profile')}
        >
          <span className="mdi mdi-account block text-xl"></span>
          <span className="text-xs">Profil</span>
        </button>
      </div>
    </div>
  );
}
