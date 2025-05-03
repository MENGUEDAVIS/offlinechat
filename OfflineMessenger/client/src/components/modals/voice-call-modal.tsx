import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

type VoiceCallModalProps = {
  onClose: () => void;
  recipientId?: number;
  recipientName?: string;
  recipientAvatar?: string;
};

export default function VoiceCallModal({ 
  onClose, 
  recipientId = 2, 
  recipientName = "Dr. Sophie Leclerc",
  recipientAvatar
}: VoiceCallModalProps) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  // Simulate call getting connected after 2 seconds
  useEffect(() => {
    if (callStatus === 'ringing') {
      const timer = setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [callStatus]);
  
  // Update call duration when connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      intervalId = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [callStatus]);
  
  // Format call duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle ending the call
  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 500);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm overflow-hidden">
        <div className="p-6 flex flex-col items-center">
          {/* User avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl">
              {recipientAvatar ? (
                <img 
                  src={recipientAvatar} 
                  alt={recipientName} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{recipientName.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            {callStatus === 'connected' && (
              <div className="absolute bottom-0 right-0 bg-accent text-white text-xs px-2 py-1 rounded-full">
                <span className="mdi mdi-phone"></span> En appel
              </div>
            )}
          </div>
          
          {/* Call details */}
          <h3 className="text-xl font-bold mb-1">{recipientName}</h3>
          <p className="text-gray-500 mb-6">
            {callStatus === 'ringing' && 'Appel en cours...'}
            {callStatus === 'connected' && `Appel en cours: ${formatDuration(callDuration)}`}
            {callStatus === 'ended' && 'Appel terminé'}
          </p>
          
          {/* Call actions */}
          <div className="flex justify-center space-x-4 mb-4">
            <button 
              className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-200'} flex items-center justify-center ${callStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => callStatus === 'connected' && setIsMuted(!isMuted)}
              disabled={callStatus !== 'connected'}
            >
              <span className={`mdi ${isMuted ? 'mdi-microphone-off' : 'mdi-microphone'} text-xl ${isMuted ? 'text-white' : 'text-gray-700'}`}></span>
            </button>
            <button 
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
              onClick={handleEndCall}
            >
              <span className="mdi mdi-phone-hangup text-2xl text-white"></span>
            </button>
            <button 
              className={`w-12 h-12 rounded-full ${isSpeakerOn ? 'bg-primary' : 'bg-gray-200'} flex items-center justify-center ${callStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => callStatus === 'connected' && setIsSpeakerOn(!isSpeakerOn)}
              disabled={callStatus !== 'connected'}
            >
              <span className={`mdi ${isSpeakerOn ? 'mdi-volume-high' : 'mdi-volume-medium'} text-xl ${isSpeakerOn ? 'text-white' : 'text-gray-700'}`}></span>
            </button>
          </div>
          
          {/* Call status indicators */}
          {callStatus === 'ringing' && (
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}