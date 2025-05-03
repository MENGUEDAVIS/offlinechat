import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIndexedDB, File } from '@/lib/useIndexedDB';
import { useWebSocket } from '@/lib/useWebSocket';

type FileUploadModalProps = {
  onClose: () => void;
  channelId?: number;
  recipientId?: number;
};

export default function FileUploadModal({ onClose, channelId, recipientId }: FileUploadModalProps) {
  const { user } = useAuth();
  const { add } = useIndexedDB();
  const { sendMessage, isConnected } = useWebSocket();
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setIsUploading(true);
    
    try {
      // Create a unique ID for the file
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real app with a server, we would upload to S3/etc.
      // For offline-first app, we store in IndexedDB
      
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: selectedFile.type });
      
      // Save file metadata and content to IndexedDB
      const newFile: File = {
        id: fileId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: blob,
        uploaderId: user.id,
        uploadedAt: Date.now()
      };
      
      await add('files', newFile);
      
      // Notify other clients about the file via WebSocket
      if (isConnected) {
        sendMessage({
          type: 'file',
          fileId,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          timestamp: Date.now(),
          senderId: user.id,
          channelId,
          recipientId,
          comment
        });
      } else {
        // For offline case, create a pending message
        // This will be synced when we come back online
        const messageData = {
          id: Date.now().toString(),
          content: comment || `Shared a file: ${selectedFile.name}`,
          timestamp: Date.now(),
          senderId: user.id,
          channelId,
          recipientId,
          fileId,
          read: false,
          pending: true
        };
        
        await add('messages', messageData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-primary text-white">
          <h2 className="text-lg font-bold">Partager un fichier</h2>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <span className="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <div className="p-4">
          {!selectedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-neutral transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="mb-4">
                <span className="mdi mdi-file-upload text-5xl text-primary"></span>
              </div>
              <h3 className="text-lg font-medium mb-2">Déposer un fichier ici</h3>
              <p className="text-sm text-gray-500 mb-2">ou</p>
              <button 
                type="button"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
              >
                Parcourir les fichiers
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Taille maximale: 100 MB
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mr-4">
                  <span className={`mdi ${
                    selectedFile.type.startsWith('image/') ? 'mdi-file-image' :
                    selectedFile.type.startsWith('video/') ? 'mdi-file-video' :
                    selectedFile.type.startsWith('audio/') ? 'mdi-file-music' :
                    selectedFile.type.includes('pdf') ? 'mdi-file-pdf' :
                    selectedFile.type.includes('word') ? 'mdi-file-word' :
                    selectedFile.type.includes('excel') ? 'mdi-file-excel' :
                    selectedFile.type.includes('powerpoint') ? 'mdi-file-powerpoint' :
                    'mdi-file'
                  } text-2xl text-primary`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button 
                  className="p-2 text-gray-500 hover:text-red-500"
                  onClick={() => setSelectedFile(null)}
                >
                  <span className="mdi mdi-close"></span>
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="comment" className="block text-gray-700 text-sm font-medium mb-1">
                  Commentaire (optionnel):
                </label>
                <textarea 
                  id="comment" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Ajouter un commentaire à propos de ce fichier..."
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
            </div>
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
            type="button"
            className={`px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 ${(!selectedFile || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="mdi mdi-loading animate-spin mr-1"></span>
                Envoi en cours...
              </>
            ) : (
              'Envoyer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}