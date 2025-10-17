import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken'; // Corregido a import
import 'dotenv/config';

import authRoutes from './routes/auth.routes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Inicialización del servidor
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*', // Restringir en producción
  },
});

// 2. Middleware de autenticación para Socket.IO
io.use((socket, next) => {
  // El token se espera como parte de la consulta en la conexión
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    // Se verifica el token con la misma clave secreta
    const decoded = jwt.verify(token, 'your-secret-key');
    // Guardamos los datos del usuario (id, email, username) en el objeto socket
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Middlewares y Rutas de Express
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(express.static('public')); // Para servir el index.html

// 3. Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id} (Usuario: ${socket.user.username})`);

  // --- EVENTO: Crear un nuevo canal ---
  socket.on('createChannel', async (data) => {
    try {
      const { name } = data;
      if (!name) {
        return socket.emit('error', { message: 'El nombre del canal es requerido.' });
      }

      // Crear el canal y conectar al usuario actual como su primer miembro
      const newChannel = await prisma.channel.create({
        data: {
          name,
          members: {
            connect: { id: socket.user.id },
          },
        },
      });

      // Unir al usuario a la "room" de Socket.IO para este canal
      socket.join(newChannel.id);

      // Confirmar la creación al cliente que lo solicitó
      socket.emit('channelCreated', newChannel);
      console.log(`📢 Canal "${newChannel.name}" creado por ${socket.user.username}`);

    } catch (error) {
      console.error('Error en createChannel:', error);
      socket.emit('error', { message: 'No se pudo crear el canal.' });
    }
  });

  // --- EVENTO: Unirse a un canal existente ---
  socket.on('joinChannel', async (data) => {
    try {
      const { channelId } = data;
      if (!channelId) {
        return socket.emit('error', { message: 'Se requiere el ID del canal.' });
      }

      // Añadir al usuario a la lista de miembros del canal en la BD
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          members: {
            connect: { id: socket.user.id },
          },
        },
      });

      // Unir al usuario a la "room" de Socket.IO
      socket.join(channelId);
      console.log(`🔗 Usuario ${socket.user.username} se unió al canal ${channelId}`);

      // Obtener y enviar el historial de mensajes del canal
      const messages = await prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { // Incluir el autor para mostrar su nombre de usuario
            select: { username: true },
          },
        },
      });
      socket.emit('messageHistory', messages);

    } catch (error) {
      console.error('Error en joinChannel:', error);
      socket.emit('error', { message: `No se pudo unir al canal ${data.channelId}.` });
    }
  });

  // --- EVENTO: Enviar un mensaje a un canal ---
  socket.on('sendMessage', async (data) => {
    try {
      const { channelId, content } = data;
      if (!channelId || !content) {
        return socket.emit('error', { message: 'Faltan datos para enviar el mensaje.' });
      }

      // 1. Guardar el mensaje en la base de datos
      const newMessage = await prisma.message.create({
        data: {
          content,
          authorId: socket.user.id,
          channelId,
        },
      });

      // 2. Preparar el objeto a retransmitir (incluyendo el username)
      const messagePayload = {
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        channelId: newMessage.channelId,
        author: {
          username: socket.user.username,
        },
      };

      // 3. Retransmitir el mensaje a TODOS los clientes en la "room" del canal
      io.to(channelId).emit('newMessage', messagePayload);
      console.log(`💬 Mensaje de ${socket.user.username} en canal ${channelId}: "${content}"`);

    } catch (error) {
      console.error('Error en sendMessage:', error);
      socket.emit('error', { message: 'No se pudo enviar el mensaje.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// 4. Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});