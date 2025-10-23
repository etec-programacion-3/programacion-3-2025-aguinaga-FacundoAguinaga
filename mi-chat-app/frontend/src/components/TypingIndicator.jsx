// src/components/TypingIndicator.jsx
function TypingIndicator({ typingUsers }) {
    if (typingUsers.length === 0) {
      return null;
    }
  
    const usersText = typingUsers.slice(0, 2).join(' y ');
    const additionalUsers = typingUsers.length > 2 ? ` y ${typingUsers.length - 2} más` : '';
  
    return (
      <div className="typing-indicator">
        <p>{`${usersText}${additionalUsers} está(n) escribiendo...`}</p>
      </div>
    );
  }
  
  export default TypingIndicator;