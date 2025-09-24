import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

// Inicialización del servidor
const app = express();
// Creamos un servidor HTTP a partir de la app de Express. Socket.IO trabajará sobre este servidor.
const server = http.createServer(app);
// Inicializamos Socket.IO, pasándole el servidor HTTP.
// La configuración de CORS permite que cualquier cliente (de cualquier origen) se conecte.
const io = new SocketServer(server, {
  cors: {
    origin: '*', // En un entorno de producción, debo restringir esto a mi dominio del frontend.
  },
});

app.use(express.static('public'));

// El puerto en el que se ejecutará el servidor.
const PORT = process.env.PORT || 3000;

// 3. Lógica de Socket.IO
// El evento 'connection' se dispara cada vez que un nuevo cliente se conecta.
io.on('connection', (socket) => {
  // El objeto 'socket' representa la conexión individual de ese cliente.
  
  // Registro en la consola del servidor que un nuevo usuario se ha conectado.
  // socket.id es un identificador único para cada conexión.
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // El evento 'disconnect' se dispara cuando ese cliente específico se desconecta.
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// 4. Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
