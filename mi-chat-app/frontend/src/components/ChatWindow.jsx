import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

function ChatWindow({ channel, messages, users, onSendMessage }) {
  if (!channel) {
    return (
      <div className="chat-window-placeholder">
        <h2>Selecciona un canal para empezar a chatear</h2>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-main-panel">
        <header className="chat-header">
          <h2># {channel.name}</h2>
        </header>
        <MessageList messages={messages} />
        <MessageInput onSendMessage={onSendMessage} />
      </div>
      <div className="chat-sidebar-right">
         <UserList users={users} />
      </div>
    </div>
  );
}

export default ChatWindow;