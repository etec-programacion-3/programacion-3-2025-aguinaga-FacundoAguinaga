import { useState, useEffect, useRef } from 'react'; // Importa useRef
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initSocket, getSocket, disconnectSocket } from '../services/socketService';

import ChannelList from '../components/ChannelList';
import ChatWindow from '../components/ChatWindow';

function ChatPage() {
  const { token, logoutAction } = useAuth();
  const navigate = useNavigate();
  
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

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

      // --- AÑADE ESTE LISTENER ---
      socket.on('updateUserList', (userList) => {
        setUsers(userList);
      });
      // --------------------------

      socket.on('newMessage', (newMessage) => {
        if (newMessage.channelId === selectedChannelRef.current?.id) {
            setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      });
      
      socket.on('error', (error) => console.error("Error de Socket.IO:", error.message));
      socket.on('channelCreated', (newChannel) => setChannels(prevChannels => [...prevChannels, newChannel]));
    }

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  const handleChannelSelect = (channel) => {
    const socket = getSocket();
    setSelectedChannel(channel); // Actualiza el estado y la ref
    setMessages([]);
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
        />
        <div className="sidebar-footer">
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
      </main>
    </div>
  );
}

export default ChatPage;