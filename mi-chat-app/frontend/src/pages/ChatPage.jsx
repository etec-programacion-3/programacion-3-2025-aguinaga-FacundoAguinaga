import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ChatPage() {
  const { logoutAction } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };

  return (
    <div>
      <h1>Bienvenido al Chat</h1>
      <p>¡Has iniciado sesión correctamente!</p>
      {/* Aquí irá la lógica del chat en el futuro */}
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
}

export default ChatPage;