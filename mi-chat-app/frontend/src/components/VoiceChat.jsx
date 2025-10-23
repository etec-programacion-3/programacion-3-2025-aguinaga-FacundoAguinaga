import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socketService';

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

function VoiceChat({ channelId }) {
  const socket = getSocket();
  const localAudioRef = useRef(null);
  const peerConnections = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localAudioRef.current) localAudioRef.current.srcObject = localStream;

        socket.on('existing-voice-users', (existingUsers) => {
          for (const socketId in existingUsers) {
            if (socketId !== socket.id) {
              console.log('Llamando a usuario existente:', socketId);
              const pc = createPeerConnection(socketId, localStream);
              pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                  socket.emit('voice-offer', { offer: pc.localDescription, targetSocketId: socketId });
                });
            }
          }
        });

        socket.on('user-joined-voice', ({ socketId }) => {
          console.log('Nuevo usuario se ha unido, esperando su oferta:', socketId);
        });

        socket.on('voice-offer', async ({ offer, fromSocketId }) => {
          console.log('Oferta recibida de:', fromSocketId);
          const pc = createPeerConnection(fromSocketId, localStream);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice-answer', { answer, targetSocketId: fromSocketId });
        });

        socket.on('voice-answer', async ({ answer, fromSocketId }) => {
          console.log('Respuesta recibida de:', fromSocketId);
          const pc = peerConnections.current[fromSocketId];
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on('ice-candidate', ({ candidate, fromSocketId }) => {
          const pc = peerConnections.current[fromSocketId];
          if (pc && candidate) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socket.on('user-left-voice', ({ socketId }) => {
          console.log('Usuario desconectado:', socketId);
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
        console.error("Error al acceder al micrófono:", error);
      }
    };

    const createPeerConnection = (remoteSocketId, localStream) => {
      if (peerConnections.current[remoteSocketId]) {
        return peerConnections.current[remoteSocketId];
      }
      const pc = new RTCPeerConnection(ICE_SERVERS);
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({ ...prev, [remoteSocketId]: event.streams[0] }));
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, targetSocketId: remoteSocketId });
        }
      };
      pc.onconnectionstatechange = () => {
        console.log(`Estado de conexión con ${remoteSocketId}: ${pc.connectionState}`);
      };
      peerConnections.current[remoteSocketId] = pc;
      return pc;
    };

    setupWebRTC();

    return () => {
      socket.emit('leave-voice-channel', channelId);
      if (localAudioRef.current && localAudioRef.current.srcObject) {
        localAudioRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      socket.off('existing-voice-users');
      socket.off('user-joined-voice');
      socket.off('voice-offer');
      socket.off('voice-answer');
      socket.off('ice-candidate');
      socket.off('user-left-voice');
    };
  }, [channelId, socket]);

  return (
    <div className="voice-chat-container">
      <h4>Chat de Voz Activo</h4>
      <audio ref={localAudioRef} autoPlay muted />
      {Object.entries(remoteStreams).map(([socketId, stream]) => (
        <RemoteAudio key={socketId} stream={stream} />
      ))}
    </div>
  );
}

// Componente auxiliar para manejar el stream en una etiqueta de audio
const RemoteAudio = ({ stream }) => {
  const audioRef = useRef(null);
  useEffect(() => {
    // 👇 LA CORRECCIÓN ESTÁ AQUÍ 👇
    if (audioRef.current) { // Cambiado de 'audio_ref' a 'audioRef'
      audioRef.current.srcObject = stream;
    }
  }, [stream]);
  return <audio ref={audioRef} autoPlay />;
};

export default VoiceChat;