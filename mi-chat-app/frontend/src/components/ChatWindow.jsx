import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import TypingIndicator from './TypingIndicator';
import { FaHashtag } from 'react-icons/fa';

function ChatWindow({ channel, messages, users, typingUsers, onSendMessage }) {
  // --- Comprobación de nulidad al principio ---
  // Si no hay canal seleccionado, muestra el mensaje de bienvenida y detiene la ejecución.
  if (!channel) {
    return (
      <div className="chat-window-placeholder">
        <div>
          <h2>¡Bienvenido a tu chat!</h2>
          <p>Selecciona o crea un canal para empezar a conversar.</p>
        </div>
      </div>
    );
  }

  // A partir de aquí, podemos asumir que 'channel' no es nulo.
  return (
    <div className="chat-window">
      <div className="chat-main-panel">
        <header className="chat-header">
          <FaHashtag size={20} color="#8e9297" />
          <h2>{channel.name}</h2>
        </header>
        <MessageList messages={messages} />
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput onSendMessage={onSendMessage} channelId={channel.id} />
      </div>
      <div className="chat-sidebar-right">
        <UserList users={users} />
      </div>
    </div>
  );
}

export default ChatWindow;