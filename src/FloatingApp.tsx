import React, { useState, useRef, useEffect } from 'react';
import './FloatingApp.css';
import { DiaVideo } from './components/character/DiaVideo';
import { Mic, MicOff, X, Maximize2 } from 'lucide-react';
import { voiceService } from './services/voiceService';
import { chatService } from './services/api';
import { closeWindow } from './services/desktopBridge';

const FloatingApp: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activity, setActivity] = useState<string>('idle');
  const [statusText, setStatusText] = useState('Say "Activate DIA" to begin');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setActivity('listening');
        setStatusText('Listening...');
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setActivity('thinking');
        setStatusText('Processing...');
        
        try {
          const diaReply = await chatService.sendMessage([
            { id: '1', role: 'user', content: transcript, createdAt: new Date().toISOString(), status: 'complete' }
          ], 0.4, 'Lohith', '');
          
          setStatusText('DIA is speaking');
          setActivity('speaking');
          
          voiceService.speak(diaReply, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => {
              setIsSpeaking(false);
              setActivity('idle');
              setStatusText('Say "Activate DIA" to begin');
            },
            onError: () => {
              setIsSpeaking(false);
              setActivity('idle');
              setStatusText('Error speaking');
            }
          });
        } catch (err) {
          console.error(err);
          setActivity('idle');
          setStatusText('Connection error');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setActivity('idle');
        setStatusText('Microphone unavailable');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setStatusText('Speech recognition unavailable');
    }
    
    return () => voiceService.stop();
  }, []);

  const handleToggleVoice = () => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
      setActivity('idle');
      setStatusText('Stopped');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleClose = () => {
    closeWindow();
    if (!('__TAURI__' in window)) {
      window.close();
    }
  };

  const handleOpenFull = () => {
    if ('__TAURI__' in window) {
      handleClose();
    } else {
      window.open('/', '_blank');
    }
  };

  // Determine dot color
  let dotClass = 'dot-idle';
  if (isListening) dotClass = 'dot-listening';
  else if (activity === 'thinking') dotClass = 'dot-thinking';
  else if (isSpeaking) dotClass = 'dot-speaking';

  return (
    <div className="floating-app-root" data-tauri-drag-region>
      <div className="floating-companion-card" data-tauri-drag-region>

        <div className="floating-video-wrapper" data-tauri-drag-region>
          <DiaVideo 
            size="lg" 
            isListening={isListening} 
            isSpeaking={isSpeaking}
            activity={activity as any}
            showStatusBadge={false}
          />
        </div>

        <div className="floating-overlay-ui">
          <div className="floating-status-pill">
            <span className={'floating-status-dot ' + dotClass} />
            <span>{statusText}</span>
          </div>

          <div className="floating-controls">
            <button 
              className={ 'floating-btn ' + (isListening ? 'listening' : '') } 
              onClick={handleToggleVoice}
              title={isSpeaking ? "Stop Speaking" : "Listen"}
            >
              {isSpeaking ? <X size={14} /> : (isListening ? <MicOff size={14} /> : <Mic size={14} />)}
            </button>
            <button className="floating-btn" onClick={handleOpenFull} title="Open Full Dia">
              <Maximize2 size={14} />
            </button>
            <button className="floating-btn" onClick={handleClose} title="Close Companion">
              <X size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FloatingApp;
