import { useEffect, useRef } from 'react';

function MessageList({ messages }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className="message">
          <div className="avatar-placeholder">
            {msg.author.username.charAt(0).toUpperCase()}
          </div>
          <div className="message-body">
            <span className="message-author">{msg.author.username}</span>
            <p className="message-content">{msg.content}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}

export default MessageList;