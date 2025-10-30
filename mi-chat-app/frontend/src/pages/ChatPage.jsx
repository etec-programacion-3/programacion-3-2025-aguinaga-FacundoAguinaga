import { useState, useEffect, useRef } from 'react'; // Importa useRef
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initSocket, getSocket, disconnectSocket } from '../services/socketService';
import MediaChat from '../components/MediaChat';
import ChannelList from '../components/ChannelList';
import ChatWindow from '../components/ChatWindow';

function ChatPage() {
  const { token, logoutAction } = useAuth();
  const navigate = useNavigate();
  const [unreadChannels, setUnreadChannels] = useState(new Set());
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [inVoiceChannel, setInVoiceChannel] = useState(false);

  // Usamos una ref para que los listeners siempre tengan acceso al canal actual
  const selectedChannelRef = useRef(selectedChannel);
  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    if (token) {
      const socket = initSocket(token);
      
      socket.emit('getChannels');

      socket.on('channelList', (serverChannels) => setChannels(serverChannels));
      socket.on('messageHistory', (history) => setMessages(history));


    // 👇 NUEVO LISTENER PARA LA DESCONEXIÓN FORZADA
    socket.on('force-disconnect', (data) => {
      alert(data.message || 'Tu sesión ha sido cerrada.');
      logoutAction();
      navigate('/login');
    });

    // Este listener recibe los mensajes más antiguos y los añade al PRINCIPIO del array
    socket.on('older-messages-loaded', (olderMessages) => {
      if (olderMessages.length > 0) {
        setMessages(prevMessages => [...olderMessages, ...prevMessages]);
      }
    });
      
      socket.on('userTyping', ({ username, channelId }) => {
        if (channelId === selectedChannelRef.current?.id) {
          setTypingUsers(prev => [...new Set([...prev, username])]);
        }
      });

      socket.on('userStoppedTyping', ({ username, channelId }) => {
        if (channelId === selectedChannelRef.current?.id) {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }
      });

      socket.on('message-updated', (updatedMessage) => {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      });

      socket.on('updateUserList', (userList) => {
        setUsers(userList);
      });
      // --------------------------

      socket.on('newMessage', (newMessage) => {
        // Si el mensaje es de un canal que no estamos viendo, lo marcamos como no leído
        if (newMessage.channelId !== selectedChannelRef.current?.id) {
          setUnreadChannels(prev => new Set(prev).add(newMessage.channelId));
        } else {
          // Si estamos viendo el canal, actualizamos los mensajes
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      });
      
      socket.on('error', (error) => console.error("Error de Socket.IO:", error.message));
      socket.on('channelCreated', (newChannel) => setChannels(prevChannels => [...prevChannels, newChannel]));
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        // 1. Primero, limpiamos todos los listeners.
        socket.off('older-messages-loaded');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
        socket.off('message-updated');
        socket.off('updateUserList');
        socket.off('newMessage');
        socket.off('error');
        socket.off('channelCreated');
        socket.off('channelList');
        socket.off('messageHistory');
        socket.off('force-disconnect');

        // 2. Y al final, nos desconectamos.
        disconnectSocket();
      }
    };
  }, [token, logoutAction, navigate]);
  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  const handleChannelSelect = (channel) => {
    const socket = getSocket();
    setSelectedChannel(channel);
    setMessages([]);
    
    // Al seleccionar un canal, lo quitamos de la lista de no leídos
    setUnreadChannels(prev => {
      const newUnread = new Set(prev);
      newUnread.delete(channel.id);
      return newUnread;
    });
    
    socket.emit('joinChannel', { channelId: channel.id });
  };
  
  const handleSendMessage = (content) => {
    const socket = getSocket();
    if (selectedChannel) {
      socket.emit('sendMessage', { 
        channelId: selectedChannel.id, 
        content: content 
      });
    }
  };

  const handleCreateChannel = () => {
    const channelName = prompt("Ingresa el nombre del nuevo canal:");
    if (channelName && channelName.trim() !== '') {
      const socket = getSocket();
      socket.emit('createChannel', { name: channelName });
      setTypingUsers([]); // Limpiar al cambiar de canal
      // Ya no necesitamos un listener temporal 'once' aquí
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar-left">
        <div className="channel-list-header">Chat App</div>
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannel?.id}
          onChannelSelect={handleChannelSelect}
          unreadChannels={unreadChannels}
        />
        <div className="sidebar-footer">
          {/* Botón para unirse al canal de voz del canal seleccionado */}
          {selectedChannel && (
            <button 
              onClick={() => setInVoiceChannel(prev => !prev)}
              className="voice-chat-button"
            >
              {inVoiceChannel ? 'Salir de Voz' : 'Unirse a Voz'}
            </button>
          )}
          <button onClick={handleCreateChannel} className="create-channel-button">
            Crear Canal
          </button>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </div>
      <main className="chat-main">
        <ChatWindow
          channel={selectedChannel}
          messages={messages}
          users={users}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
        />
        {/* Renderizado condicional del componente de voz */}
        {inVoiceChannel && selectedChannel && <MediaChat channelId={selectedChannel.id} />}
      </main>
    </div>
  );
}

export default ChatPage;