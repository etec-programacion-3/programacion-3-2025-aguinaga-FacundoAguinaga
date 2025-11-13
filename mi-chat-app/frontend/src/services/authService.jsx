// La URL base de tu API de backend
const API_URL = 'http://10.56.182.58:3000/api/auth'; // Asegúrate que esta URL sea correcta para tu entorno

/**
 * Registra un nuevo usuario.
 * @param {object} credentials - { email, username, password }
 */
export const register = async (credentials) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al registrar');
  }
  return response.json();
};

/**
 * Inicia sesión de un usuario.
 * @param {object} credentials - { identifier, password }
 */
export const login = async (credentials) => {
  // 👇 CORRECCIÓN CLAVE: El backend espera 'identifier', no 'email'
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials), // credentials ya es { identifier, password }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al iniciar sesión');
  }
  return response.json();
};