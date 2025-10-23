import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirigir al usuario a la página de login si no está autenticado
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;