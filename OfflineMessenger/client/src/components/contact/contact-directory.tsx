import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIndexedDB, User } from '@/lib/useIndexedDB';

type ContactDirectoryProps = {
  onSelectContact: (contactId: number) => void;
  onClose: () => void;
};

type ContactRole = 'all' | 'teacher' | 'student' | 'staff';

export default function ContactDirectory({ onSelectContact, onClose }: ContactDirectoryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRole, setActiveRole] = useState<ContactRole>('all');
  const [contacts, setContacts] = useState<User[]>([]);
  
  // Simuler la récupération des contacts
  useEffect(() => {
    // En production, ce serait une requête API pour obtenir les utilisateurs
    const mockContacts: User[] = [
      {
        id: 1,
        username: 'admin',
        displayName: 'Directeur',
        role: 'admin',
        online: true,
        lastSeen: Date.now(),
        position: 'Directeur de l\'établissement',
        department: 'Administration'
      },
      {
        id: 2,
        username: 'prof_math',
        displayName: 'Dr. Sophie Leclerc',
        role: 'teacher',
        online: true,
        lastSeen: Date.now(),
        position: 'Professeur de Mathématiques',
        department: 'Sciences'
      },
      {
        id: 3,
        username: 'prof_francais',
        displayName: 'Marc Dupont',
        role: 'teacher',
        online: false,
        lastSeen: Date.now() - 3600000,
        position: 'Professeur de Français',
        department: 'Lettres'
      },
      {
        id: 4,
        username: 'etudiant1',
        displayName: 'Léa Martin',
        role: 'student',
        online: true,
        lastSeen: Date.now(),
        position: 'Élève',
        department: 'Classe 4A'
      },
      {
        id: 5,
        username: 'etudiant2',
        displayName: 'Thomas Dubois',
        role: 'student',
        online: false,
        lastSeen: Date.now() - 7200000,
        position: 'Élève',
        department: 'Classe 3B'
      },
      {
        id: 6,
        username: 'secretaire',
        displayName: 'Julie Moreau',
        role: 'staff',
        online: true,
        lastSeen: Date.now(),
        position: 'Secrétaire',
        department: 'Administration'
      },
      {
        id: 7,
        username: 'bibliothecaire',
        displayName: 'Pierre Lefort',
        role: 'staff',
        online: false,
        lastSeen: Date.now() - 86400000,
        position: 'Bibliothécaire',
        department: 'Bibliothèque'
      }
    ];

    setContacts(mockContacts);
  }, []);

  // Filtrer les contacts par recherche et par rôle
  const filteredContacts = contacts.filter(contact => {
    // Exclure l'utilisateur actuel
    if (contact.id === user?.id) return false;
    
    // Filtre de recherche
    const matchesSearch = 
      contact.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre de rôle
    const matchesRole = 
      activeRole === 'all' ||
      (activeRole === 'teacher' && contact.role === 'teacher') ||
      (activeRole === 'student' && contact.role === 'student') ||
      (activeRole === 'staff' && contact.role === 'staff');
    
    return matchesSearch && matchesRole;
  });
  
  // Génère les initiales d'un utilisateur
  const getUserInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  // Formater la dernière heure de connexion
  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-primary text-white">
          <h2 className="text-lg font-bold">Annuaire des contacts</h2>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <span className="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <span className="mdi mdi-magnify"></span>
            </span>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-2 border-b border-gray-200 flex space-x-2">
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeRole === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveRole('all')}
          >
            Tous
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeRole === 'teacher' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveRole('teacher')}
          >
            Enseignants
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeRole === 'student' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveRole('student')}
          >
            Étudiants
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeRole === 'staff' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveRole('staff')}
          >
            Personnel
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className="p-3 hover:bg-neutral cursor-pointer flex items-center"
                  onClick={() => {
                    onSelectContact(contact.id);
                    onClose();
                  }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mr-3">
                      <span className="text-primary font-medium">{getUserInitials(contact.displayName)}</span>
                    </div>
                    {contact.online && (
                      <span className="absolute bottom-0 right-2 w-3 h-3 bg-accent rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{contact.displayName}</div>
                    <div className="text-sm text-gray-500 truncate">{contact.position} • {contact.department}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {contact.online ? 'En ligne' : formatLastSeen(contact.lastSeen)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <span className="mdi mdi-account-search text-4xl text-gray-300 mb-2"></span>
              <p className="text-gray-500">Aucun contact ne correspond à votre recherche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}