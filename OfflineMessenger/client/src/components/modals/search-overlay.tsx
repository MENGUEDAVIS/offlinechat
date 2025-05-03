import { useState } from 'react';

type SearchOverlayProps = {
  onClose: () => void;
};

type SearchResult = {
  id: string;
  type: 'user' | 'message' | 'channel';
  title: string;
  subtitle: string;
  time?: string;
  avatar: string;
};

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'messages' | 'channels'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // In a real app, you'd make an API call or search IndexedDB here
    // For now, we'll just simulate search results
    if (value.length > 1) {
      // Mock results, in a real app this would be filtered by the search term and filter type
      setResults([
        {
          id: '1',
          type: 'user',
          title: 'Marie Curie',
          subtitle: 'Professeur',
          avatar: 'MC',
        },
        {
          id: '2',
          type: 'message',
          title: 'Dans "Physique Avancée"',
          subtitle: '... regardez ce document sur les équations de maxwell ...',
          time: 'il y a 2 jours',
          avatar: 'message',
        },
        {
          id: '3',
          type: 'channel',
          title: 'Salon: Mathématiques',
          subtitle: '26 membres, créé par Albert Einstein',
          avatar: 'channel',
        },
      ]);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-4 mx-auto mt-20 max-w-2xl rounded-lg shadow-lg w-full m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recherche</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary">
            <span className="mdi mdi-magnify text-xl"></span>
          </span>
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
            placeholder="Rechercher des utilisateurs ou messages..."
            value={searchTerm}
            onChange={handleSearch}
            autoFocus
          />
        </div>
        
        <div className="mt-4">
          <div className="flex space-x-2 mb-3 overflow-x-auto">
            <button 
              className={`px-3 py-1 rounded-full text-sm ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-neutral text-gray-700 hover:bg-secondary'}`}
              onClick={() => setActiveFilter('all')}
            >
              Tous
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-sm ${activeFilter === 'users' ? 'bg-primary text-white' : 'bg-neutral text-gray-700 hover:bg-secondary'}`}
              onClick={() => setActiveFilter('users')}
            >
              Utilisateurs
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-sm ${activeFilter === 'messages' ? 'bg-primary text-white' : 'bg-neutral text-gray-700 hover:bg-secondary'}`}
              onClick={() => setActiveFilter('messages')}
            >
              Messages
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-sm ${activeFilter === 'channels' ? 'bg-primary text-white' : 'bg-neutral text-gray-700 hover:bg-secondary'}`}
              onClick={() => setActiveFilter('channels')}
            >
              Salons
            </button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* Search Results */}
            {results.length > 0 ? (
              results
                .filter(result => activeFilter === 'all' || result.type === activeFilter)
                .map(result => (
                  <div key={result.id} className="p-2 hover:bg-neutral rounded flex items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                      {result.type === 'user' ? (
                        <span className="text-primary font-medium">{result.avatar}</span>
                      ) : result.type === 'message' ? (
                        <span className="mdi mdi-message-text text-xl text-primary"></span>
                      ) : (
                        <span className="mdi mdi-forum text-xl text-primary"></span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{result.title}</div>
                      <div className={result.type === 'message' ? 'text-sm' : 'text-sm text-gray-500'}>
                        {result.type === 'message' && (
                          <>... <span className="bg-secondary px-1 rounded">{searchTerm}</span> ...</>
                        ) || result.subtitle}
                      </div>
                      {result.time && <div className="text-xs text-gray-500">{result.time}</div>}
                    </div>
                  </div>
                ))
            ) : searchTerm.length > 0 ? (
              <div className="p-6 text-center text-gray-500">
                <span className="mdi mdi-magnify text-4xl block mb-2"></span>
                <p>Aucun résultat pour "{searchTerm}"</p>
              </div>
            ) : null}
            
            {/* Empty State */}
            {searchTerm.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <span className="mdi mdi-magnify text-4xl block mb-2"></span>
                <p>Commencez à taper pour rechercher</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
