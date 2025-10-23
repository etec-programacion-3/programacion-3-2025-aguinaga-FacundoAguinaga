import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const voiceChannels = {};

// 1. Inicialización del servidor
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5173", // La dirección exacta de tu frontend
    methods: ["GET", "POST"]
  },
});

// 2. Middleware de autenticación para Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  try {
    // Usa la variable de entorno para la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Middlewares y Rutas de Express
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Sirve los archivos estáticos de la build de React
app.use(express.static(path.join(__dirname, '../dist')));
// 3. Redirige todas las demás peticiones al index.html de React
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});
// 3. Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id} (Usuario: ${socket.user.username})`);
  socket.joinedChannels = new Set(); // Para rastrear los canales a los que se une el socket

  // --- Evento para obtener la lista de canales ---
  socket.on('getChannels', async () => {
    try {
      const allChannels = await prisma.channel.findMany();
      socket.emit('channelList', allChannels);
    } catch (error) {
      console.error('Error en getChannels:', error);
      socket.emit('error', { message: 'No se pudo obtener la lista de canales.' });
    }
  });

  // --- Evento para crear un nuevo canal ---
  socket.on('createChannel', async (data) => {
    try {
      const { name } = data;
      if (!name) {
        return socket.emit('error', { message: 'El nombre del canal es requerido.' });
      }
      const newChannel = await prisma.channel.create({
        data: {
          name,
          members: {
            connect: { id: socket.user.id },
          },
        },
      });
      socket.join(newChannel.id);
      socket.emit('channelCreated', newChannel);
      console.log(`📢 Canal "${newChannel.name}" creado por ${socket.user.username}`);
    } catch (error) {
      console.error('Error en createChannel:', error);
      socket.emit('error', { message: 'No se pudo crear el canal.' });
    }
  });

  // --- Evento para unirse a un canal existente ---
  socket.on('joinChannel', async (data) => {
    try {
      const { channelId } = data;
      if (!channelId) {
        return socket.emit('error', { message: 'Se requiere el ID del canal.' });
      }

      await prisma.channel.update({
        where: { id: channelId },
        data: { members: { connect: { id: socket.user.id } } },
      });

      socket.join(channelId);
      socket.joinedChannels.add(channelId); // Rastrea el canal unido

      console.log(`🔗 Usuario ${socket.user.username} se unió al canal ${channelId}`);

      const updatedChannel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { members: { select: { id: true, username: true } } },
      });
      io.to(channelId).emit('updateUserList', updatedChannel.members);

      const messages = await prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { username: true } } },
      });
      socket.emit('messageHistory', messages);

    } catch (error) {
      console.error('Error en joinChannel:', error);
      socket.emit('error', { message: `No se pudo unir al canal ${data.channelId}.` });
    }
  });

  // --- Evento para enviar un mensaje ---
  socket.on('sendMessage', async (data) => {
    try {
      const { channelId, content } = data;
      if (!channelId || !content) {
        return socket.emit('error', { message: 'Faltan datos para enviar el mensaje.' });
      }
      const newMessage = await prisma.message.create({
        data: {
          content,
          authorId: socket.user.id,
          channelId,
        },
      });
      const messagePayload = {
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        channelId: newMessage.channelId,
        author: {
          username: socket.user.username,
        },
      };
      io.to(channelId).emit('newMessage', messagePayload);
      console.log(`💬 Mensaje de ${socket.user.username} en canal ${channelId}: "${content}"`);
    } catch (error) {
      console.error('Error en sendMessage:', error);
      socket.emit('error', { message: 'No se pudo enviar el mensaje.' });
    }
  });

  // --- Eventos para el indicador de "Escribiendo..." ---
  socket.on('startTyping', ({ channelId }) => {
    socket.broadcast.to(channelId).emit('userTyping', {
      username: socket.user.username,
      channelId,
    });
  });

  socket.on('stopTyping', ({ channelId }) => {
    socket.broadcast.to(channelId).emit('userStoppedTyping', {
      username: socket.user.username,
      channelId,
    });
  });

  // --- Evento de desconexión ---
  socket.on('disconnect', async () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
    
    for (const channelId of socket.joinedChannels) {
      // Primero, elimina al usuario de la lista de miembros en la BD
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          members: {
            disconnect: { id: socket.user.id },
          },
        },
      });

      // Luego, obtén la lista actualizada de miembros
      const updatedChannel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: { select: { id: true, username: true } } },
      });

      // Finalmente, notifica a los clientes restantes en el canal
      if (updatedChannel) {
        io.to(channelId).emit('updateUserList', updatedChannel.members);
      }
    }
  });

  // --- Eventos de Señalización para WebRTC ---

  socket.on('join-voice-channel', (channelId) => {
    // Si el canal de voz no existe en nuestro registro, lo creamos
    if (!voiceChannels[channelId]) {
      voiceChannels[channelId] = {};
    }

    // Enviamos al nuevo usuario la lista de los que ya estaban
    const existingUsers = voiceChannels[channelId];
    socket.emit('existing-voice-users', existingUsers);

    // Añadimos al nuevo usuario al registro
    voiceChannels[channelId][socket.id] = socket.user.id;
    
    // Notificamos a los demás que un nuevo usuario se ha unido
    socket.broadcast.to(channelId).emit('user-joined-voice', { 
      userId: socket.user.id, 
      socketId: socket.id 
    });
  });

  socket.on('leave-voice-channel', (channelId) => {
    if (voiceChannels[channelId]) {
      delete voiceChannels[channelId][socket.id];
      socket.broadcast.to(channelId).emit('user-left-voice', { socketId: socket.id });
    }
  });

  // Reenviar oferta, respuesta y candidatos (estos no cambian)
  socket.on('voice-offer', ({ offer, targetSocketId }) => {
    socket.to(targetSocketId).emit('voice-offer', { offer, fromSocketId: socket.id });
  });

  socket.on('voice-answer', ({ answer, targetSocketId }) => {
    socket.to(targetSocketId).emit('voice-answer', { answer, fromSocketId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
    socket.to(targetSocketId).emit('ice-candidate', { candidate, fromSocketId: socket.id });
  });

  socket.on('disconnect', async () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
    
    // Eliminar al usuario de cualquier canal de voz en el que estuviera
    for (const channelId in voiceChannels) {
      if (voiceChannels[channelId][socket.id]) {
        delete voiceChannels[channelId][socket.id];
        socket.broadcast.to(channelId).emit('user-left-voice', { socketId: socket.id });
      }
    }
  });
});

// 4. Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://<10.56.182.58:>:${PORT}`);
});