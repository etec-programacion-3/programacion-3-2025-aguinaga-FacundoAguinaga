import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socketService';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

function MediaChat({ channelId }) {
  const socket = getSocket();
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null); // Ref para acceder al stream desde fuera del useEffect
  const peerConnections = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  
  // Estados para QoL
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [focusedStreamId, setFocusedStreamId] = useState(null);

  useEffect(() => {
    const createPeerConnection = (remoteSocketId, stream) => {
      if (peerConnections.current[remoteSocketId]) {
        return peerConnections.current[remoteSocketId];
      }
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (event) => setRemoteStreams(prev => ({ ...prev, [remoteSocketId]: event.streams[0] }));
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { targetSocketId: remoteSocketId, candidate: event.candidate });
        }
      };
      peerConnections.current[remoteSocketId] = pc;
      return pc;
    };

    const setupWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream; // Guardamos el stream en la ref
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.on('existing-voice-users', (existingUsers) => {
          for (const socketId in existingUsers) {
            if (socketId !== socket.id) {
              const pc = createPeerConnection(socketId, stream);
              pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => socket.emit('voice-offer', { offer: pc.localDescription, targetSocketId: socketId }));
            }
          }
        });

        socket.on('voice-offer', async ({ offer, fromSocketId }) => {
          const pc = createPeerConnection(fromSocketId, stream);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice-answer', { answer, targetSocketId: fromSocketId });
        });

        socket.on('voice-answer', async ({ answer, fromSocketId }) => {
          const pc = peerConnections.current[fromSocketId];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', ({ candidate, fromSocketId }) => {
          const pc = peerConnections.current[fromSocketId];
          if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
        
        socket.on('user-left-voice', ({ socketId }) => {
          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[socketId];
            return newStreams;
          });
        });

        socket.emit('join-voice-channel', channelId);
      } catch (error) {
        console.error("Error al acceder a la cámara o micrófono:", error);
      }
    };

    setupWebRTC();

    return () => {
      socket.emit('leave-voice-channel', channelId);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      socket.off('existing-voice-users');
      socket.off('voice-offer');
      socket.off('voice-answer');
      socket.off('ice-candidate');
      socket.off('user-left-voice');
    };
  }, [channelId, socket]);

  // --- FUNCIONES DE CONTROL (fuera del useEffect) ---
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };
  
  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  };
  
  const handleVideoClick = (streamId) => {
    setFocusedStreamId(prev => (prev === streamId ? null : streamId));
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="media-chat-container">
      <div className={focusedStreamId ? 'video-grid focused' : 'video-grid'}>
        {/* Tu video local */}
        <div 
          className={`video-item ${focusedStreamId === 'local' ? 'is-focused' : ''}`}
          onClick={() => handleVideoClick('local')}
        >
          <video ref={localVideoRef} autoPlay muted playsInline />
        </div>
        
        {/* Videos de los otros participantes */}
        {Object.entries(remoteStreams).map(([socketId, stream]) => (
          <div 
            key={socketId}
            className={`video-item ${focusedStreamId === socketId ? 'is-focused' : ''}`}
            onClick={() => handleVideoClick(socketId)}
          >
            <RemoteMedia stream={stream} />
          </div>
        ))}
      </div>
      
      {/* Barra de Controles */}
      <div className="media-controls">
        <button onClick={toggleMute} className={isMuted ? 'control-off' : ''}>
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleCamera} className={isCameraOff ? 'control-off' : ''}>
          {isCameraOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
      </div>
    </div>
  );
}

const RemoteMedia = ({ stream }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline />;
};

export default MediaChat;