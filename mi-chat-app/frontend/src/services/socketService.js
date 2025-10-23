import { io } from 'socket.io-client';

// URL de tu servidor backend
const SERVER_URL = 'http://localhost:3000';

let socket;

/**
 * Inicia la conexión con el servidor de Socket.IO.
 * Se debe llamar a esta función una vez que el usuario se ha autenticado.
 * @param {string} token - El JWT del usuario para autenticar la conexión.
 */
export const initSocket = (token) => {
  // Conectar al servidor pasando el token como un query param
  socket = io(SERVER_URL, {
    query: { token },
  });

  socket.on('connect', () => {
    console.log('✅ Conectado al servidor de Socket.IO');
  });

  socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor de Socket.IO');
  });

  return socket;
};

/**
 * Retorna la instancia del socket.
 * Asegúrate de que initSocket haya sido llamado primero.
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket no inicializado. Llama a initSocket primero.');
  }
  return socket;
};

/**
 * Desconecta el socket del servidor.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};