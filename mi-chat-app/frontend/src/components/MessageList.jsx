import { useEffect, useRef } from 'react';

function MessageList({ messages }) {
  const endOfMessagesRef = useRef(null);

  // Efecto para hacer scroll hacia el último mensaje
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className="message">
          <span className="message-author">{msg.author.name}:</span>
          <p className="message-content">{msg.content}</p>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}

export default MessageList;