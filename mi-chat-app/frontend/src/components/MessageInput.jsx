import { useState, useRef, useEffect } from 'react';
import { getSocket } from '../services/socketService';
import EmojiPicker from 'emoji-picker-react';
import { IoMdSend } from 'react-icons/io';
import { FaSmile } from 'react-icons/fa';

function MessageInput({ onSendMessage, channelId }) {
  const [message, setMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const handleTyping = () => {
    if (!socket || !channelId) return;
    socket.emit('startTyping', { channelId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { channelId });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      onSendMessage(message);
      socket.emit('stopTyping', { channelId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessage('');
      setShowPicker(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowPicker(false);
  };

  return (
    // 👇 LA CORRECCIÓN: Envolver todo en un div contenedor
    <div className="message-input-container">
      {showPicker && (
        <div className="emoji-picker-input">
          <EmojiPicker 
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
          />
        </div>
      )}
      <form className="message-input-form" onSubmit={handleSubmit}>
        <div className="message-input-wrapper">
          <button type="button" onClick={() => setShowPicker(val => !val)}>
            <FaSmile />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            placeholder={`Enviar mensaje a #${channelId ? 'canal' : '...'}`}
          />
          <button type="submit">
            <IoMdSend size={24} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageInput;