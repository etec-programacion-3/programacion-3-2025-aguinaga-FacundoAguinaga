import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAction } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { token } = await login({ identifier, password });
      loginAction(token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">Slard</h1>
        <h2 className="auth-header">Bienvenido de nuevo</h2>
        <p className="auth-subtitle">¡Nos alegra verte otra vez!</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="identifier" // 👇 AÑADE EL ATRIBUTO name
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email o Nombre de Usuario"
            autoComplete="username" // Ayuda al autocompletado
            required
          />
          <input
            type="password"
            name="password" // 👇 AÑADE EL ATRIBUTO name
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password" // Ayuda al autocompletado
            required
          />
          <button type="submit">Iniciar Sesión</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <div className="switch-auth">
          ¿Necesitas una cuenta? <Link to="/register">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;