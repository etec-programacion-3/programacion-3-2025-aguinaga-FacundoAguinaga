import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Importar los nuevos componentes
import ChannelList from '../components/ChannelList';
import ChatWindow from '../components/ChatWindow';

// --- DATOS DE EJEMPLO (MOCK DATA) ---
// En el futuro, esto vendrá de tu backend
const mockChannels = [
  { id: '1', name: 'general' },
  { id: '2', name: 'random' },
  { id: '3', name: 'tech' },
];

const mockMessages = {
  '1': [
    { id: 'm1', content: 'Bienvenidos al canal general!', author: { id: 'u1', name: 'Admin' } },
    { id: 'm2', content: 'Hola a todos.', author: { id: 'u2', name: 'Facundo' } },
  ],
  '2': [
    { id: 'm3', content: 'Este es el canal random.', author: { id: 'u1', name: 'Admin' } },
  ],
  '3': [], // Canal sin mensajes
};

const mockUsers = {
    '1': [{id: 'u1', name: 'Admin'}, {id: 'u2', name: 'Facundo'}],
    '2': [{id: 'u1', name: 'Admin'}],
    '3': [],
}
// --- FIN DE DATOS DE EJEMPLO ---


function ChatPage() {
  const { logoutAction } = useAuth();
  const navigate = useNavigate();

  // Estados para gestionar la UI del chat
  const [channels] = useState(mockChannels);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setMessages(mockMessages[channel.id] || []);
    setUsers(mockUsers[channel.id] || []);
  };
  
  const handleSendMessage = (messageContent) => {
    // Simula el envío de un mensaje
    const newMessage = {
      id: `m${Date.now()}`, // ID temporal
      content: messageContent,
      author: { id: 'u2', name: 'Facundo' }, // Usamos un usuario de ejemplo
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar-left">
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannel?.id}
          onChannelSelect={handleChannelSelect}
        />
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
      <main className="chat-main">
        <ChatWindow
          channel={selectedChannel}
          messages={messages}
          users={users}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}

export default ChatPage;