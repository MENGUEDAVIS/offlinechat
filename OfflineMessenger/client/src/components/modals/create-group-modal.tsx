import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIndexedDB, User } from '@/lib/useIndexedDB';

type CreateGroupModalProps = {
  onClose: () => void;
};

type UserOption = {
  id: number;
  displayName: string;
  username: string;
  initials: string;
  selected: boolean;
  role: string;
  department?: string;
};

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [groupType, setGroupType] = useState<'channel' | 'class'>('channel');
  
  // Fake data for users
  useEffect(() => {
    // In a real app, this would be an API call
    const mockUsers: UserOption[] = [
      {
        id: 1,
        displayName: 'Administrateur',
        username: 'admin',
        initials: 'AD',
        selected: false,
        role: 'admin'
      },
      {
        id: 2,
        displayName: 'Dr. Sophie Leclerc',
        username: 'prof_math',
        initials: 'SL',
        selected: false,
        role: 'teacher',
        department: 'Mathématiques'
      },
      {
        id: 3,
        displayName: 'Marc Dupont',
        username: 'prof_francais',
        initials: 'MD',
        selected: false,
        role: 'teacher',
        department: 'Français'
      },
      {
        id: 4,
        displayName: 'Léa Martin',
        username: 'etudiant1',
        initials: 'LM',
        selected: false,
        role: 'student',
        department: 'Classe 4A'
      },
      {
        id: 5,
        displayName: 'Thomas Dubois',
        username: 'etudiant2',
        initials: 'TD',
        selected: false,
        role: 'student',
        department: 'Classe 3B'
      }
    ];
    
    // Filter out current user
    const filteredUsers = mockUsers.filter(u => u.id !== user?.id);
    setUsers(filteredUsers);
  }, [user?.id]);
  
  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, selected: !u.selected } : u
      )
    );
  };
  
  // Selected users count
  const selectedCount = users.filter(u => u.selected).length;
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Veuillez entrer un nom pour le groupe');
      return;
    }
    
    // Get selected user IDs
    const selectedUserIds = users
      .filter(u => u.selected)
      .map(u => u.id);
    
    // In a real app, create the channel in the database
    const newChannel = {
      name: groupName,
      description: groupDescription,
      isPublic,
      type: groupType,
      memberIds: [...selectedUserIds, user?.id]
    };
    
    // Call API to create channel
    console.log('Creating channel:', newChannel);
    
    // Close the modal
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-primary text-white">
          <h2 className="text-lg font-bold">Créer un {groupType === 'channel' ? 'groupe' : 'salon de classe'}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <span className="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex mb-4">
              <button 
                type="button"
                className={`flex-1 py-2 px-4 rounded-l-lg ${groupType === 'channel' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
                onClick={() => setGroupType('channel')}
              >
                Groupe de discussion
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 px-4 rounded-r-lg ${groupType === 'class' ? 'bg-primary text-white' : 'bg-neutral text-gray-700'}`}
                onClick={() => setGroupType('class')}
              >
                Salon de classe
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="groupName" className="block text-gray-700 text-sm font-medium mb-1">
                Nom {groupType === 'class' ? 'de la classe' : 'du groupe'}:
              </label>
              <input 
                type="text" 
                id="groupName" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder={groupType === 'class' ? 'Ex: Classe 4A' : 'Ex: Groupe projet chimie'}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="groupDescription" className="block text-gray-700 text-sm font-medium mb-1">
                Description:
              </label>
              <textarea 
                id="groupDescription" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder={groupType === 'class' ? 'Description de la classe...' : 'Description du groupe...'}
                rows={3}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isPublic" 
                  className="w-4 h-4 text-primary focus:ring-primary rounded" 
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <label htmlFor="isPublic" className="ml-2 text-gray-700 text-sm">
                  {groupType === 'class' ? 'Salon ouvert à tous les étudiants' : 'Groupe public'}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isPublic ? 
                  groupType === 'class' ? 'Tous les étudiants pourront voir et rejoindre ce salon' : 'Tous les utilisateurs pourront voir et rejoindre ce groupe' : 
                  'Seuls les membres invités pourront voir et accéder'}
              </p>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium mb-2">Ajouter des membres</h3>
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <span className="mdi mdi-magnify"></span>
              </span>
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-500">
                {selectedCount === 0 ? 'Aucun utilisateur sélectionné' : 
                 `${selectedCount} utilisateur${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <li 
                    key={user.id} 
                    className="p-3 hover:bg-neutral cursor-pointer flex items-center"
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary focus:ring-primary rounded mr-3"
                      checked={user.selected}
                      onChange={() => toggleUserSelection(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                      <span className="text-primary font-medium">{user.initials}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${user.role === 'teacher' ? 'bg-blue-500' : user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'} mr-1`}></span>
                        {user.role === 'teacher' ? 'Enseignant' : user.role === 'admin' ? 'Administrateur' : 'Étudiant'}
                        {user.department && ` • ${user.department}`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button 
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={onClose}
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80"
              disabled={!groupName.trim()}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}