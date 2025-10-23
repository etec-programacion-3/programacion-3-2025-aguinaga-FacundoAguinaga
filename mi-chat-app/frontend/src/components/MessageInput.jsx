// src/components/MessageInput.jsx
import { useState, useRef, useEffect } from 'react';
import { IoMdSend } from 'react-icons/io';
import { getSocket } from '../services/socketService';

function MessageInput({ onSendMessage, channelId }) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('startTyping', { channelId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { channelId });
    }, 2000); // Se detiene después de 2 segundos de inactividad
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      onSendMessage(message);
      socket.emit('stopTyping', { channelId }); // Deja de escribir al enviar
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessage('');
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="message-input-wrapper">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder={`Enviar mensaje a #${channelId ? 'canal' : '...'}`} // Placeholder dinámico
        />
        <button type="submit"><IoMdSend size={24} /></button>
      </div>
    </form>
  );
}

export default MessageInput;