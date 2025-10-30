import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

// Componente para la cabecera del chat
const ChatHeader = ({ channelName }) => (
  <div className="chat-header">
    <h2># {channelName}</h2>
  </div>
);

// Componente para el indicador de "escribiendo..."
const TypingIndicator = ({ users }) => {
  if (users.length === 0) {
    return <div className="typing-indicator"></div>;
  }
  
  const typingText = users.length === 1 
    ? `${users[0]} está escribiendo...` 
    : `${users.join(', ')} están escribiendo...`;

  return (
    <div className="typing-indicator">
      {typingText}
    </div>
  );
};

// Componente principal de la ventana de chat
function ChatWindow({ channel, messages, users, typingUsers, onSendMessage }) {
  // Muestra un placeholder si no hay ningún canal seleccionado
  if (!channel) {
    return (
      <div className="chat-window-placeholder">
        <div>
          <h2>Bienvenido a tu Chat App</h2>
          <p>Selecciona un canal para comenzar a chatear.</p>
        </div>
      </div>
    );
  }

  return (
    // 👇 ESTRUCTURA CORREGIDA 👇
    <div className="chat-window-content">
      {/* 1. Panel principal que contiene el chat */}
      <div className="chat-main-panel">
        <ChatHeader channelName={channel.name} />
        <MessageList 
          messages={messages} 
          channelId={channel.id} 
        />
        <TypingIndicator users={typingUsers} />
        <MessageInput 
          onSendMessage={onSendMessage} 
          channelId={channel.id} 
        />
      </div>

      {/* 2. La lista de usuarios es ahora "hermana" del panel principal y se posicionará a la derecha */}
      <UserList users={users} />
    </div>
  );
}

export default ChatWindow;